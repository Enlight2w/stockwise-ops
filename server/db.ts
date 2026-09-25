import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
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
    return { success: true };
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
