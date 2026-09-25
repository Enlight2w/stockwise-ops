import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { buildLowStockAlert } from "./db";
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
