import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  InsertUser,
  inventoryAlerts,
  products,
  reviews,
  sales,
  shops,
  teamInvites,
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

export async function getShopByOwnerId(ownerUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(shops).where(eq(shops.ownerUserId, ownerUserId)).limit(1))[0];
}

export async function updateOwnerProductPrice(ownerUserId: number, productId: number, salePriceCents: number) {
  const db = await getDb();
  if (!db) return null;
  const shop = await getShopByOwnerId(ownerUserId);
  if (!shop) return null;
  const product = (await db.select().from(products).where(and(eq(products.id, productId), eq(products.shopId, shop.id))).limit(1))[0];
  if (!product) throw new Error("Product not found in the owner workspace.");
  await db.update(products).set({ salePriceCents }).where(and(eq(products.id, productId), eq(products.shopId, shop.id)));
  return { success: true, productId, salePriceCents };
}

export async function getTeamMemberForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(teamMembers).where(and(eq(teamMembers.userId, userId), eq(teamMembers.active, true))).limit(1))[0];
}

export async function getStaffForOwner(ownerUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const shop = await getShopByOwnerId(ownerUserId);
  if (!shop) return null;
  const [members, invites] = await Promise.all([
    db.select().from(teamMembers).where(eq(teamMembers.shopId, shop.id)).orderBy(desc(teamMembers.monthlyUnits)),
    db.select().from(teamInvites).where(eq(teamInvites.shopId, shop.id)).orderBy(desc(teamInvites.createdAt)),
  ]);
  return { shop, members, invites };
}

export async function createStaffInvite(ownerUserId: number, input: { email: string; permissionRole: "manager" | "sales" | "inventory" | "support" }) {
  const db = await getDb();
  if (!db) return null;
  const shop = await getShopByOwnerId(ownerUserId);
  if (!shop) return null;
  const [created] = await db.insert(teamInvites).values({
    shopId: shop.id,
    email: input.email,
    permissionRole: input.permissionRole,
    inviteToken: nanoid(24),
  }).$returningId();
  const invite = (await db.select().from(teamInvites).where(eq(teamInvites.id, created.id)).limit(1))[0];
  return { shop, invite };
}

export async function updateStaffPermission(ownerUserId: number, memberId: number, permissionRole: "manager" | "sales" | "inventory" | "support") {
  const db = await getDb();
  if (!db) return null;
  const shop = await getShopByOwnerId(ownerUserId);
  if (!shop) return null;
  await db.update(teamMembers).set({ permissionRole }).where(and(eq(teamMembers.id, memberId), eq(teamMembers.shopId, shop.id), eq(teamMembers.role, "employee")));
  return { success: true };
}

export async function revokeStaffInvite(ownerUserId: number, inviteId: number) {
  const db = await getDb();
  if (!db) return null;
  const shop = await getShopByOwnerId(ownerUserId);
  if (!shop) return null;
  await db.update(teamInvites).set({ status: "revoked" }).where(and(eq(teamInvites.id, inviteId), eq(teamInvites.shopId, shop.id)));
  return { success: true };
}

export async function acceptStaffInvite(userId: number, userEmail: string | null, userName: string, inviteToken: string) {
  const db = await getDb();
  if (!db) return null;
  const invite = (await db.select().from(teamInvites).where(and(eq(teamInvites.inviteToken, inviteToken), eq(teamInvites.status, "pending"))).limit(1))[0];
  if (!invite) throw new Error("This invitation is invalid, expired, or already used.");
  if (!userEmail || userEmail.toLowerCase() !== invite.email.toLowerCase()) throw new Error("Sign in with the invited email address to accept this invitation.");
  const existing = (await db.select().from(teamMembers).where(and(eq(teamMembers.shopId, invite.shopId), eq(teamMembers.userId, userId))).limit(1))[0];
  if (!existing) {
    await db.insert(teamMembers).values({ shopId: invite.shopId, userId, name: userName, email: userEmail, role: "employee", permissionRole: invite.permissionRole });
  }
  await db.update(teamInvites).set({ status: "accepted", acceptedAt: new Date() }).where(eq(teamInvites.id, invite.id));
  return { success: true, shopId: invite.shopId, permissionRole: invite.permissionRole };
}

export async function getPublicShopDirectory() {
  const db = await getDb();
  if (!db) return [];
  const listedShops = await db.select().from(shops).where(and(eq(shops.beaconEnabled, true), isNotNull(shops.latitude), isNotNull(shops.longitude))).orderBy(desc(shops.updatedAt));
  return Promise.all(listedShops.map(async shop => ({
    id: shop.id,
    name: shop.name,
    businessType: shop.businessType,
    address: shop.address,
    latitude: Number(shop.latitude),
    longitude: Number(shop.longitude),
    currencyCode: shop.currencyCode,
    inventory: await db.select({ id: products.id, name: products.name, category: products.category, unit: products.unit, stockOnHand: products.stockOnHand, salePriceCents: products.salePriceCents }).from(products).where(and(eq(products.shopId, shop.id), gt(products.stockOnHand, 0))).orderBy(desc(products.updatedAt)),
  })));
}

export async function submitCustomerReview(input: { shopId: number; customerName: string; productRating: number; serviceRating: number; comment?: string }) {
  const db = await getDb();
  if (!db) return null;
  const listedShop = (await db.select().from(shops).where(and(eq(shops.id, input.shopId), eq(shops.beaconEnabled, true))).limit(1))[0];
  if (!listedShop) throw new Error("This shop is not accepting public reviews right now.");
  await db.insert(reviews).values(input);
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
