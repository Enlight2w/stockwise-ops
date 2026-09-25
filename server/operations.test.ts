import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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
