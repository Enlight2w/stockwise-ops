import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  inventoryAlerts,
  products,
  reviews,
  sales,
  shops,
  teamMembers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getOwnerWorkspace(ownerUserId: number, ownerName: string) {
  const db = await getDb();
  if (!db) return null;

  let shop = (await db.select().from(shops).where(eq(shops.ownerUserId, ownerUserId)).limit(1))[0];
  if (!shop) {
    const [created] = await db.insert(shops).values({
      ownerUserId,
      name: `${ownerName}'s shop`,
      businessType: "retail",
      subscriptionPlan: "starter",
      subscriptionStatus: "trialing",
      countryCode: "US",
      currencyCode: "USD",
      languageCode: "en",
      setupCompleted: false,
    }).$returningId();
    shop = (await db.select().from(shops).where(eq(shops.id, created.id)).limit(1))[0];
  }
  if (!shop) return null;

  const ownerMember = (await db.select().from(teamMembers).where(and(eq(teamMembers.shopId, shop.id), eq(teamMembers.role, "owner"))).limit(1))[0];
  if (!ownerMember) {
    await db.insert(teamMembers).values({ shopId: shop.id, userId: ownerUserId, name: ownerName, role: "owner", avatarColor: "#ef8354" });
  }

  const [inventory, team, recentReviews, recentSales, alerts] = await Promise.all([
    db.select().from(products).where(eq(products.shopId, shop.id)).orderBy(desc(products.updatedAt)),
    db.select().from(teamMembers).where(and(eq(teamMembers.shopId, shop.id), eq(teamMembers.active, true))).orderBy(desc(teamMembers.monthlyUnits)),
    db.select().from(reviews).where(eq(reviews.shopId, shop.id)).orderBy(desc(reviews.createdAt)).limit(12),
    db.select().from(sales).where(eq(sales.shopId, shop.id)).orderBy(desc(sales.soldAt)).limit(40),
    getInventoryAlerts(shop.id),
  ]);
  return { shop, inventory, team, reviews: recentReviews, sales: recentSales, alerts };
}

export async function updateShopProfile(ownerUserId: number, input: {
  name: string;
  businessType: "retail" | "wholesale" | "hybrid";
  countryCode: string;
  currencyCode: string;
  languageCode: string;
  subscriptionPlan: "starter" | "growth" | "scale";
}) {
  const db = await getDb();
  if (!db) return null;
  await db.update(shops).set({ ...input, setupCompleted: true }).where(eq(shops.ownerUserId, ownerUserId));
  return { success: true };
}

export async function getShopSnapshot() {
  const db = await getDb();
  if (!db) return null;
  const shop = await db.select().from(shops).orderBy(desc(shops.createdAt)).limit(1);
  if (!shop[0]) return null;
  const [inventory, team, recentReviews, recentSales] = await Promise.all([
    db.select().from(products).where(eq(products.shopId, shop[0].id)).orderBy(desc(products.updatedAt)),
    db.select().from(teamMembers).where(and(eq(teamMembers.shopId, shop[0].id), eq(teamMembers.active, true))).orderBy(desc(teamMembers.monthlyUnits)),
    db.select().from(reviews).where(eq(reviews.shopId, shop[0].id)).orderBy(desc(reviews.createdAt)).limit(12),
    db.select().from(sales).where(eq(sales.shopId, shop[0].id)).orderBy(desc(sales.soldAt)).limit(40),
  ]);
  return { shop: shop[0], inventory, team, reviews: recentReviews, sales: recentSales };
}

export async function getInventoryAlerts(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryAlerts)
    .where(eq(inventoryAlerts.shopId, shopId))
    .orderBy(desc(inventoryAlerts.createdAt))
    .limit(20);
}

export async function markInventoryAlertRead(alertId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(inventoryAlerts).set({ readAt: new Date() }).where(eq(inventoryAlerts.id, alertId));
  return { success: true };
}

export function buildLowStockAlert(input: {
  productName: string;
  unit: string;
  previousStock: number;
  nextStock: number;
  reorderLevel: number;
}) {
  const crossedLowStockThreshold = input.previousStock > input.reorderLevel && input.nextStock <= input.reorderLevel;
  if (!crossedLowStockThreshold) return null;
  return {
    title: `${input.productName} is low on stock`,
    message: `${input.productName} has ${Math.max(0, input.nextStock)} ${input.unit} remaining. Reorder threshold: ${input.reorderLevel}.`,
  };
}

export async function createSale(input: {
  shopId: number;
  productId: number;
  employeeId?: number;
  quantity: number;
  revenueCents: number;
  profitCents: number;
}) {
  const db = await getDb();
  if (!db) return null;
  return db.transaction(async tx => {
    const productRows = await tx.select().from(products).where(eq(products.id, input.productId)).limit(1);
    const product = productRows[0];
    if (!product) throw new Error("Product not found");

    const nextStock = product.stockOnHand - input.quantity;
    await tx.insert(sales).values(input);
    await tx.update(products)
      .set({ stockOnHand: sql`${products.stockOnHand} - ${input.quantity}` })
      .where(eq(products.id, input.productId));
    if (input.employeeId) {
      await tx.update(teamMembers)
        .set({
          monthlyUnits: sql`${teamMembers.monthlyUnits} + ${input.quantity}`,
          yearlyUnits: sql`${teamMembers.yearlyUnits} + ${input.quantity}`,
        })
        .where(eq(teamMembers.id, input.employeeId));
    }

    const lowStockAlert = buildLowStockAlert({
      productName: product.name,
      unit: product.unit,
      previousStock: product.stockOnHand,
      nextStock,
      reorderLevel: product.reorderLevel,
    });
    if (!lowStockAlert) return { success: true, lowStockAlert: null };

    const [alert] = await tx.insert(inventoryAlerts).values({
      shopId: input.shopId,
      productId: product.id,
      title: lowStockAlert.title,
      message: lowStockAlert.message,
    }).$returningId();

    return {
      success: true,
      lowStockAlert: { id: alert.id, ...lowStockAlert, productName: product.name, stockOnHand: Math.max(0, nextStock), reorderLevel: product.reorderLevel },
    };
  });
}

export async function setShopBeacon(shopId: number, enabled: boolean, latitude?: string, longitude?: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(shops).set({ beaconEnabled: enabled, latitude, longitude }).where(eq(shops.id, shopId));
  return { success: true };
}

export async function markReview(reviewId: number, status: "new" | "reviewed" | "archived") {
  const db = await getDb();
  if (!db) return null;
  await db.update(reviews).set({ status }).where(eq(reviews.id, reviewId));
  return { success: true };
}
