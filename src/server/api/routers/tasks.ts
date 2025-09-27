import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { GoogleOAuthService } from "~/server/services/googleOAuth";
import { GoogleTasksService } from "~/server/services/googleTasks";

const googleOAuth = new GoogleOAuthService();

export const tasksRouter = createTRPCRouter({
  getTaskLists: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get user with tokens
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!user || !user.accessToken) {
          throw new Error("User not authenticated");
        }

        // Create authenticated client
        const authClient = googleOAuth.createAuthenticatedClient(
          user.accessToken,
          user.refreshToken,
        );

        const tasksService = new GoogleTasksService(authClient);
        const taskLists = await tasksService.getTaskLists();

        return {
          success: true,
          taskLists,
        };
      } catch (error) {
        console.error("Failed to fetch task lists:", error);
        throw new Error("Failed to fetch Google Task lists");
      }
    }),

  createTaskList: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user with tokens
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!user || !user.accessToken) {
          throw new Error("User not authenticated");
        }

        // Create authenticated client
        const authClient = googleOAuth.createAuthenticatedClient(
          user.accessToken,
          user.refreshToken,
        );

        const tasksService = new GoogleTasksService(authClient);
        const taskList = await tasksService.createTaskList(input.title);

        return {
          success: true,
          taskList,
        };
      } catch (error) {
        console.error("Failed to create task list:", error);
        throw new Error("Failed to create Google Task list");
      }
    }),

  getTasks: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        taskListId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get user with tokens
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!user || !user.accessToken) {
          throw new Error("User not authenticated");
        }

        // Create authenticated client
        const authClient = googleOAuth.createAuthenticatedClient(
          user.accessToken,
          user.refreshToken,
        );

        const tasksService = new GoogleTasksService(authClient);
        const tasks = await tasksService.getTasks(input.taskListId);

        return {
          success: true,
          tasks,
        };
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        throw new Error("Failed to fetch Google Tasks");
      }
    }),

  getSyncedTasks: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        integrationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        canvasIntegration: {
          userId: input.userId,
        },
      };

      if (input.integrationId) {
        whereClause.canvasIntegrationId = input.integrationId;
      }

      const syncedTasks = await ctx.db.syncedTask.findMany({
        where: whereClause,
        include: {
          canvasIntegration: {
            select: {
              taskListName: true,
              taskListId: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
      });

      return syncedTasks.map((task) => ({
        id: task.id,
        canvasEventId: task.canvasEventId,
        googleTaskId: task.googleTaskId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate?.toISOString(),
        course: task.course,
        status: task.status,
        taskListName: task.canvasIntegration.taskListName,
        taskListId: task.canvasIntegration.taskListId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }));
    }),

  getSyncLogs: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const syncLogs = await ctx.db.syncLog.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return syncLogs.map((log) => ({
        id: log.id,
        status: log.status,
        message: log.message,
        tasksProcessed: log.tasksProcessed,
        tasksCreated: log.tasksCreated,
        tasksUpdated: log.tasksUpdated,
        tasksSkipped: log.tasksSkipped,
        errors: log.errors ? JSON.parse(log.errors) : [],
        createdAt: log.createdAt.toISOString(),
      }));
    }),
});
