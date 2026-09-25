import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus auth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const shops = mysqlTable("shops", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId"),
  name: varchar("name", { length: 160 }).notNull(),
  businessType: mysqlEnum("businessType", ["retail", "wholesale", "hybrid"]).default("retail").notNull(),
  address: varchar("address", { length: 240 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  beaconEnabled: boolean("beaconEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  shopId: int("shopId").notNull(),
  userId: int("userId"),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["owner", "employee"]).default("employee").notNull(),
  avatarColor: varchar("avatarColor", { length: 20 }).default("#ef8354").notNull(),
  monthlyUnits: int("monthlyUnits").default(0).notNull(),
  yearlyUnits: int("yearlyUnits").default(0).notNull(),
  targetUnits: int("targetUnits").default(1000).notNull(),
  active: boolean("active").default(true).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  shopId: int("shopId").notNull(),
  sku: varchar("sku", { length: 48 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 96 }).notNull(),
  unit: varchar("unit", { length: 32 }).default("unit").notNull(),
  stockOnHand: int("stockOnHand").default(0).notNull(),
  reorderLevel: int("reorderLevel").default(10).notNull(),
  costPriceCents: int("costPriceCents").default(0).notNull(),
  salePriceCents: int("salePriceCents").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  shopId: int("shopId").notNull(),
  productId: int("productId").notNull(),
  employeeId: int("employeeId"),
  quantity: int("quantity").notNull(),
  revenueCents: int("revenueCents").notNull(),
  profitCents: int("profitCents").notNull(),
  soldAt: timestamp("soldAt").defaultNow().notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  shopId: int("shopId").notNull(),
  customerName: varchar("customerName", { length: 120 }).notNull(),
  productRating: int("productRating").notNull(),
  serviceRating: int("serviceRating").notNull(),
  comment: text("comment"),
  status: mysqlEnum("status", ["new", "reviewed", "archived"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Review = typeof reviews.$inferSelect;
