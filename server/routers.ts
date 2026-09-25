import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createSale, getInventoryAlerts, getShopSnapshot, markInventoryAlertRead, markReview, setShopBeacon } from "./db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner access is required for this action." });
  }
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  operations: router({
    snapshot: publicProcedure.query(() => getShopSnapshot()),
    alerts: adminProcedure
      .input(z.object({ shopId: z.number().int().positive() }))
      .query(({ input }) => getInventoryAlerts(input.shopId)),
    markAlertRead: adminProcedure
      .input(z.object({ alertId: z.number().int().positive() }))
      .mutation(({ input }) => markInventoryAlertRead(input.alertId)),
    logSale: protectedProcedure
      .input(z.object({
        shopId: z.number().int().positive(),
        productId: z.number().int().positive(),
        employeeId: z.number().int().positive().optional(),
        quantity: z.number().int().positive().max(10000),
        revenueCents: z.number().int().nonnegative(),
        profitCents: z.number().int(),
      }))
      .mutation(async ({ input }) => {
        const result = await createSale(input);
        if (result?.lowStockAlert) {
          let ownerNotificationSent = false;
          try {
            ownerNotificationSent = await notifyOwner({
              title: result.lowStockAlert.title,
              content: `${result.lowStockAlert.message} Open Stockwise Ops to review and reorder.`,
            });
          } catch (error) {
            console.warn("[LowStock] Owner notification unavailable; in-app alert was saved.", error);
          }
          return { ...result, ownerNotificationSent };
        }
        return result;
      }),
    setBeacon: adminProcedure
      .input(z.object({
        shopId: z.number().int().positive(),
        enabled: z.boolean(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(({ input }) => setShopBeacon(input.shopId, input.enabled, input.latitude, input.longitude)),
    markReview: adminProcedure
      .input(z.object({ reviewId: z.number().int().positive(), status: z.enum(["new", "reviewed", "archived"]) }))
      .mutation(({ input }) => markReview(input.reviewId, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
