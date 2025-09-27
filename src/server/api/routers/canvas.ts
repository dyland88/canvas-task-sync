import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { CanvasService } from "~/server/services/canvas";

const canvasService = new CanvasService();

export const canvasRouter = createTRPCRouter({
  validateUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const isValid = await canvasService.validateCanvasUrl(input.url);
        return {
          valid: isValid,
          message: isValid
            ? "Canvas calendar URL is valid"
            : "Invalid Canvas calendar URL",
        };
      } catch (error) {
        return {
          valid: false,
          message: "Failed to validate Canvas URL",
        };
      }
    }),

  getAssignments: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const assignments = await canvasService.fetchAndParseCalendar(
          input.url,
        );

        return {
          success: true,
          assignments: assignments.map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate?.toISOString(),
            course: assignment.course,
            url: assignment.url,
          })),
        };
      } catch (error) {
        console.error("Failed to fetch Canvas assignments:", error);
        throw new Error("Failed to fetch assignments from Canvas");
      }
    }),

  createIntegration: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        canvasUrl: z.string().url(),
        taskListId: z.string(),
        taskListName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate the Canvas URL first
        const isValid = await canvasService.validateCanvasUrl(input.canvasUrl);
        if (!isValid) {
          throw new Error("Invalid Canvas calendar URL");
        }

        // Create the integration
        const integration = await ctx.db.canvasIntegration.create({
          data: {
            userId: input.userId,
            canvasUrl: input.canvasUrl,
            taskListId: input.taskListId,
            taskListName: input.taskListName,
            isActive: true,
          },
        });

        return {
          success: true,
          integration: {
            id: integration.id,
            canvasUrl: integration.canvasUrl,
            taskListId: integration.taskListId,
            taskListName: integration.taskListName,
            isActive: integration.isActive,
            createdAt: integration.createdAt,
          },
        };
      } catch (error) {
        console.error("Failed to create Canvas integration:", error);
        throw new Error("Failed to create Canvas integration");
      }
    }),

  getUserIntegrations: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const integrations = await ctx.db.canvasIntegration.findMany({
        where: {
          userId: input.userId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return integrations.map((integration) => ({
        id: integration.id,
        canvasUrl: integration.canvasUrl,
        taskListId: integration.taskListId,
        taskListName: integration.taskListName,
        isActive: integration.isActive,
        lastSyncAt: integration.lastSyncAt?.toISOString(),
        createdAt: integration.createdAt.toISOString(),
      }));
    }),

  updateIntegration: publicProcedure
    .input(
      z.object({
        integrationId: z.string(),
        userId: z.string(),
        canvasUrl: z.string().url().optional(),
        taskListId: z.string().optional(),
        taskListName: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the integration belongs to the user
        const existingIntegration = await ctx.db.canvasIntegration.findFirst({
          where: {
            id: input.integrationId,
            userId: input.userId,
          },
        });

        if (!existingIntegration) {
          throw new Error("Integration not found");
        }

        // Validate Canvas URL if provided
        if (input.canvasUrl) {
          const isValid = await canvasService.validateCanvasUrl(
            input.canvasUrl,
          );
          if (!isValid) {
            throw new Error("Invalid Canvas calendar URL");
          }
        }

        const integration = await ctx.db.canvasIntegration.update({
          where: { id: input.integrationId },
          data: {
            canvasUrl: input.canvasUrl,
            taskListId: input.taskListId,
            taskListName: input.taskListName,
            isActive: input.isActive,
          },
        });

        return {
          success: true,
          integration: {
            id: integration.id,
            canvasUrl: integration.canvasUrl,
            taskListId: integration.taskListId,
            taskListName: integration.taskListName,
            isActive: integration.isActive,
            lastSyncAt: integration.lastSyncAt?.toISOString(),
            updatedAt: integration.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        console.error("Failed to update Canvas integration:", error);
        throw new Error("Failed to update Canvas integration");
      }
    }),

  deleteIntegration: publicProcedure
    .input(
      z.object({
        integrationId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the integration belongs to the user
        const existingIntegration = await ctx.db.canvasIntegration.findFirst({
          where: {
            id: input.integrationId,
            userId: input.userId,
          },
        });

        if (!existingIntegration) {
          throw new Error("Integration not found");
        }

        // Soft delete by setting isActive to false
        await ctx.db.canvasIntegration.update({
          where: { id: input.integrationId },
          data: { isActive: false },
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to delete Canvas integration:", error);
        throw new Error("Failed to delete Canvas integration");
      }
    }),
});
