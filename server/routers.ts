import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acceptStaffInvite, createSale, createStaffInvite, getInventoryAlerts, getOwnerWorkspace, getPublicShopDirectory, getShopByOwnerId, getShopSnapshot, getStaffForOwner, getTeamMemberForUser, markInventoryAlertRead, markReview, revokeStaffInvite, setShopBeacon, submitCustomerReview, updateShopProfile, updateStaffPermission } from "./db";
import { getMarketAnalysis, getMarketAnalysisBatch } from "./market";
import { getOwnerAiMarketInsights } from "./insights";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner access is required for this action." });
  }
  return next();
});

const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const ownerShop = await getShopByOwnerId(ctx.user.id);
  if (!ownerShop && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Shop owner access is required for this action." });
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
    publicDirectory: publicProcedure.query(() => getPublicShopDirectory()),
    submitReview: publicProcedure
      .input(z.object({
        shopId: z.number().int().positive(),
        customerName: z.string().trim().min(2).max(120),
        productRating: z.number().int().min(1).max(5),
        serviceRating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).optional(),
      }))
      .mutation(({ input }) => submitCustomerReview(input)),
    workspace: protectedProcedure.query(({ ctx }) => getOwnerWorkspace(ctx.user.id, ctx.user.name ?? "Shop owner")),
    saveOwnerProfile: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(160),
        businessType: z.enum(["retail", "wholesale", "hybrid"]),
        countryCode: z.string().trim().min(2).max(8),
        currencyCode: z.string().trim().min(3).max(8),
        languageCode: z.string().trim().min(2).max(12),
        subscriptionPlan: z.enum(["starter", "growth", "scale"]),
      }))
      .mutation(({ ctx, input }) => updateShopProfile(ctx.user.id, input)),
    marketAnalysis: protectedProcedure
      .input(z.object({
        productName: z.string().trim().min(2).max(160),
        category: z.string().trim().max(96).optional(),
        countryCode: z.string().trim().min(2).max(8),
        currencyCode: z.string().trim().min(3).max(8),
      }))
      .query(({ input }) => getMarketAnalysis(input)),
    marketAnalysisBatch: protectedProcedure
      .input(z.object({
        items: z.array(z.object({ productName: z.string().trim().min(2).max(160), category: z.string().trim().max(96).optional() })).max(8),
        countryCode: z.string().trim().min(2).max(8),
        currencyCode: z.string().trim().min(3).max(8),
      }))
      .query(({ input }) => getMarketAnalysisBatch(input)),
    aiMarketInsights: ownerProcedure.query(({ ctx }) => getOwnerAiMarketInsights(ctx.user.id)),
    staff: ownerProcedure.query(({ ctx }) => getStaffForOwner(ctx.user.id)),
    inviteStaff: ownerProcedure
      .input(z.object({ email: z.string().trim().email(), permissionRole: z.enum(["manager", "sales", "inventory", "support"]) }))
      .mutation(({ ctx, input }) => createStaffInvite(ctx.user.id, input)),
    updateStaffPermission: ownerProcedure
      .input(z.object({ memberId: z.number().int().positive(), permissionRole: z.enum(["manager", "sales", "inventory", "support"]) }))
      .mutation(({ ctx, input }) => updateStaffPermission(ctx.user.id, input.memberId, input.permissionRole)),
    revokeStaffInvite: ownerProcedure
      .input(z.object({ inviteId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => revokeStaffInvite(ctx.user.id, input.inviteId)),
    acceptStaffInvite: protectedProcedure
      .input(z.object({ inviteToken: z.string().trim().min(8).max(96) }))
      .mutation(({ ctx, input }) => acceptStaffInvite(ctx.user.id, ctx.user.email, ctx.user.name ?? "Team member", input.inviteToken)),
    alerts: ownerProcedure
      .input(z.object({ shopId: z.number().int().positive() }))
      .query(({ input }) => getInventoryAlerts(input.shopId)),
    markAlertRead: ownerProcedure
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
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          const member = await getTeamMemberForUser(ctx.user.id);
          const canLogSale = member?.role === "owner" || member?.permissionRole === "manager" || member?.permissionRole === "sales";
          if (!canLogSale) throw new TRPCError({ code: "FORBIDDEN", message: "Your staff role cannot log sales." });
        }
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
    setBeacon: ownerProcedure
      .input(z.object({
        shopId: z.number().int().positive(),
        enabled: z.boolean(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(({ input }) => setShopBeacon(input.shopId, input.enabled, input.latitude, input.longitude)),
    markReview: ownerProcedure
      .input(z.object({ reviewId: z.number().int().positive(), status: z.enum(["new", "reviewed", "archived"]) }))
      .mutation(({ input }) => markReview(input.reviewId, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
