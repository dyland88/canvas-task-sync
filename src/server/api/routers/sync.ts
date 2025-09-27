import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { SyncService } from "~/server/services/sync";
import { GoogleOAuthService } from "~/server/services/googleOAuth";
import { CanvasService } from "~/server/services/canvas";
import { CronService } from "~/server/services/cron";

const googleOAuth = new GoogleOAuthService();
const canvasService = new CanvasService();
const cronService = new CronService();

export const syncRouter = createTRPCRouter({
  syncUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const syncService = new SyncService(ctx.db, googleOAuth, canvasService);
        const results = await syncService.syncUserIntegrations(input.userId);

        return {
          success: true,
          results: results.map((result) => ({
            status: result.status,
            message: result.message,
            tasksProcessed: result.tasksProcessed,
            tasksCreated: result.tasksCreated,
            tasksUpdated: result.tasksUpdated,
            tasksSkipped: result.tasksSkipped,
            errors: result.errors,
          })),
        };
      } catch (error) {
        console.error("Manual sync failed:", error);
        throw new Error("Manual sync failed");
      }
    }),

  syncIntegration: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        integrationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the integration belongs to the user
        const integration = await ctx.db.canvasIntegration.findFirst({
          where: {
            id: input.integrationId,
            userId: input.userId,
            isActive: true,
          },
        });

        if (!integration) {
          throw new Error("Integration not found");
        }

        const syncService = new SyncService(ctx.db, googleOAuth, canvasService);
        const results = await syncService.syncUserIntegrations(input.userId);

        // Filter results for this specific integration
        const integrationResult =
          results.find((r) => r.status !== "error") || results[0];

        return {
          success: true,
          result: {
            status: integrationResult?.status || "error",
            message: integrationResult?.message,
            tasksProcessed: integrationResult?.tasksProcessed || 0,
            tasksCreated: integrationResult?.tasksCreated || 0,
            tasksUpdated: integrationResult?.tasksUpdated || 0,
            tasksSkipped: integrationResult?.tasksSkipped || 0,
            errors: integrationResult?.errors || [],
          },
        };
      } catch (error) {
        console.error("Integration sync failed:", error);
        throw new Error("Integration sync failed");
      }
    }),

  getSyncStatus: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get user's integrations with last sync times
      const integrations = await ctx.db.canvasIntegration.findMany({
        where: {
          userId: input.userId,
          isActive: true,
        },
        select: {
          id: true,
          taskListName: true,
          lastSyncAt: true,
          createdAt: true,
        },
      });

      // Get recent sync logs
      const recentLogs = await ctx.db.syncLog.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return {
        integrations: integrations.map((integration) => ({
          id: integration.id,
          taskListName: integration.taskListName,
          lastSyncAt: integration.lastSyncAt?.toISOString(),
          createdAt: integration.createdAt.toISOString(),
        })),
        recentLogs: recentLogs.map((log) => ({
          id: log.id,
          status: log.status,
          message: log.message,
          tasksProcessed: log.tasksProcessed,
          tasksCreated: log.tasksCreated,
          tasksUpdated: log.tasksUpdated,
          errors: log.errors ? JSON.parse(log.errors) : [],
          createdAt: log.createdAt.toISOString(),
        })),
      };
    }),

  getLastSyncTime: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const latestSync = await ctx.db.syncLog.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
      });

      return {
        lastSyncAt: latestSync?.createdAt.toISOString() || null,
        status: latestSync?.status || null,
      };
    }),

  // Admin/development endpoints
  triggerGlobalSync: publicProcedure
    .input(z.object({ adminKey: z.string() }))
    .mutation(async ({ input }) => {
      // Simple admin key check (in production, use proper auth)
      if (input.adminKey !== process.env.ADMIN_KEY) {
        throw new Error("Unauthorized");
      }

      try {
        await cronService.runSyncForAllUsers();
        return { success: true, message: "Global sync triggered successfully" };
      } catch (error) {
        console.error("Global sync failed:", error);
        throw new Error("Global sync failed");
      }
    }),

  getGlobalSyncStats: publicProcedure
    .input(z.object({ adminKey: z.string() }))
    .query(async ({ ctx, input }) => {
      // Simple admin key check (in production, use proper auth)
      if (input.adminKey !== process.env.ADMIN_KEY) {
        throw new Error("Unauthorized");
      }

      // Get sync statistics
      const totalUsers = await ctx.db.user.count();
      const activeIntegrations = await ctx.db.canvasIntegration.count({
        where: { isActive: true },
      });
      const totalSyncedTasks = await ctx.db.syncedTask.count();

      // Get recent sync logs
      const recentLogs = await ctx.db.syncLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { email: true },
          },
        },
      });

      return {
        totalUsers,
        activeIntegrations,
        totalSyncedTasks,
        recentLogs: recentLogs.map((log) => ({
          id: log.id,
          userEmail: log.user.email,
          status: log.status,
          message: log.message,
          tasksProcessed: log.tasksProcessed,
          createdAt: log.createdAt.toISOString(),
        })),
      };
    }),
});
