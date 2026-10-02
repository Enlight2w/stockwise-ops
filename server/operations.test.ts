import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { buildLowStockAlert } from "./db";
import { getMarketAnalysis } from "./market";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("operations router", () => {
  it("allows a public snapshot read for the dashboard shell", async () => {
    const result = await appRouter.createCaller(createContext()).operations.snapshot();
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("requires an authenticated user to log a sale", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.operations.logSale({
      shopId: 1,
      productId: 1,
      quantity: 2,
      revenueCents: 2000,
      profitCents: 700,
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates an alert only when stock crosses the reorder threshold", () => {
    expect(buildLowStockAlert({ productName: "Citrus Sparkling Water", unit: "cases", previousStock: 42, nextStock: 9, reorderLevel: 10 })).toMatchObject({
      title: "Citrus Sparkling Water is low on stock",
      message: "Citrus Sparkling Water has 9 cases remaining. Reorder threshold: 10.",
    });
    expect(buildLowStockAlert({ productName: "Citrus Sparkling Water", unit: "cases", previousStock: 9, nextStock: 8, reorderLevel: 10 })).toBeNull();
    expect(buildLowStockAlert({ productName: "Citrus Sparkling Water", unit: "cases", previousStock: 42, nextStock: 12, reorderLevel: 10 })).toBeNull();
  });

  it("keeps inventory alerts owner-only", async () => {
    const user: AuthenticatedUser = {
      id: 2,
      openId: "employee-test",
      email: "employee@example.com",
      name: "Employee Test",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createContext(user));
    await expect(caller.operations.alerts({ shopId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires authentication for owner workspace data", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.operations.workspace()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps staff management owner-only", async () => {
    const user: AuthenticatedUser = {
      id: 2,
      openId: "employee-test",
      email: "employee@example.com",
      name: "Employee Test",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createContext(user));
    await expect(caller.operations.staff()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates public customer reviews before writing them", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.operations.submitReview({
      shopId: 0,
      customerName: "A",
      productRating: 6,
      serviceRating: 5,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("parses live market prices and preserves the source label", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<a class="result__a">Granola retailer</a><a class="result__snippet">Available for $12.50 per pack</a><a class="result__a">Market listing</a><a class="result__snippet">Typical price US$18.00 today</a>',
    }));
    const result = await getMarketAnalysis({ productName: "Harvest Granola", category: "Pantry", countryCode: "US", currencyCode: "USD" });
    expect(result.sourceType).toBe("live_web_snapshot");
    expect(result.low).toBe(12.5);
    expect(result.high).toBe(18);
    expect(result.sources[0]?.title).toBe("Granola retailer");
    vi.unstubAllGlobals();
  });

  it("rejects invalid sale quantities", async () => {
    const user: AuthenticatedUser = {
      id: 2,
      openId: "employee-test",
      email: "employee@example.com",
      name: "Employee Test",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createContext(user));
    await expect(caller.operations.logSale({
      shopId: 1,
      productId: 1,
      quantity: 0,
      revenueCents: 2000,
      profitCents: 700,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
