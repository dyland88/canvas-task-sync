import { PrismaClient } from "@prisma/client";
import { GoogleOAuthService } from "./googleOAuth";
import { GoogleTasksService } from "./googleTasks";
import { CanvasService, type CanvasAssignment } from "./canvas";

export interface SyncResult {
  status: "success" | "error" | "partial";
  message?: string;
  tasksProcessed: number;
  tasksCreated: number;
  tasksUpdated: number;
  tasksSkipped: number;
  errors: string[];
}

export class SyncService {
  constructor(
    private prisma: PrismaClient,
    private googleOAuth: GoogleOAuthService,
    private canvasService: CanvasService,
  ) {}

  async syncUserIntegrations(userId: string): Promise<SyncResult[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { canvasIntegrations: { where: { isActive: true } } },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const results: SyncResult[] = [];

    for (const integration of user.canvasIntegrations) {
      try {
        const result = await this.syncIntegration(user, integration);
        results.push(result);

        // Update last sync time
        await this.prisma.canvasIntegration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date() },
        });

        // Log successful sync
        await this.prisma.syncLog.create({
          data: {
            userId: user.id,
            integrationId: integration.id,
            status: result.status,
            message: result.message,
            tasksProcessed: result.tasksProcessed,
            tasksCreated: result.tasksCreated,
            tasksUpdated: result.tasksUpdated,
            tasksSkipped: result.tasksSkipped,
            errors:
              result.errors.length > 0 ? JSON.stringify(result.errors) : null,
          },
        });
      } catch (error) {
        const errorResult: SyncResult = {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
          tasksProcessed: 0,
          tasksCreated: 0,
          tasksUpdated: 0,
          tasksSkipped: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        };

        results.push(errorResult);

        // Log error
        await this.prisma.syncLog.create({
          data: {
            userId: user.id,
            integrationId: integration.id,
            status: "error",
            message: errorResult.message,
            errors: JSON.stringify(errorResult.errors),
          },
        });
      }
    }

    return results;
  }

  private async syncIntegration(
    user: any,
    integration: any,
  ): Promise<SyncResult> {
    const result: SyncResult = {
      status: "success",
      tasksProcessed: 0,
      tasksCreated: 0,
      tasksUpdated: 0,
      tasksSkipped: 0,
      errors: [],
    };

    try {
      // Refresh Google tokens if needed
      const authClient = await this.getAuthenticatedGoogleClient(user);
      const tasksService = new GoogleTasksService(authClient);

      // Fetch assignments from Canvas
      const assignments = await this.canvasService.fetchAndParseCalendar(
        integration.canvasUrl,
      );
      result.tasksProcessed = assignments.length;

      // Get existing synced tasks for this integration
      const existingSyncedTasks = await this.prisma.syncedTask.findMany({
        where: { canvasIntegrationId: integration.id },
      });

      const existingTasksMap = new Map(
        existingSyncedTasks.map((task) => [task.canvasEventId, task]),
      );

      // Process each assignment
      for (const assignment of assignments) {
        try {
          const existingTask = existingTasksMap.get(assignment.id);

          if (existingTask) {
            // Check if task needs updating
            const needsUpdate = this.shouldUpdateTask(existingTask, assignment);

            if (needsUpdate) {
              await this.updateTask(
                tasksService,
                integration,
                existingTask,
                assignment,
              );
              result.tasksUpdated++;
            } else {
              result.tasksSkipped++;
            }
          } else {
            // Create new task
            await this.createTask(tasksService, integration, assignment);
            result.tasksCreated++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to process assignment "${assignment.title}": ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      // Clean up tasks that no longer exist in Canvas (optional)
      await this.cleanupOrphanedTasks(
        tasksService,
        integration,
        assignments,
        existingSyncedTasks,
      );

      if (
        result.errors.length > 0 &&
        result.tasksCreated === 0 &&
        result.tasksUpdated === 0
      ) {
        result.status = "error";
      } else if (result.errors.length > 0) {
        result.status = "partial";
      }
    } catch (error) {
      result.status = "error";
      result.message = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(result.message);
    }

    return result;
  }

  private async getAuthenticatedGoogleClient(user: any) {
    // Check if token is expired
    const now = new Date();
    const tokenExpiry = user.tokenExpiry ? new Date(user.tokenExpiry) : null;

    if (tokenExpiry && now >= tokenExpiry) {
      // Refresh the token
      const newTokens = await this.googleOAuth.refreshAccessToken(
        user.refreshToken,
      );

      // Update user with new tokens
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || user.refreshToken,
          tokenExpiry: newTokens.expiry_date
            ? new Date(newTokens.expiry_date)
            : null,
        },
      });

      return this.googleOAuth.createAuthenticatedClient(
        newTokens.access_token,
        newTokens.refresh_token || user.refreshToken,
      );
    }

    return this.googleOAuth.createAuthenticatedClient(
      user.accessToken,
      user.refreshToken,
    );
  }

  private shouldUpdateTask(
    existingTask: any,
    assignment: CanvasAssignment,
  ): boolean {
    // Check if title, description, or due date has changed
    return (
      existingTask.title !== assignment.title ||
      existingTask.description !== (assignment.description || null) ||
      existingTask.dueDate?.getTime() !== assignment.dueDate?.getTime() ||
      existingTask.course !== (assignment.course || null)
    );
  }

  private async createTask(
    tasksService: GoogleTasksService,
    integration: any,
    assignment: CanvasAssignment,
  ): Promise<void> {
    // Create task in Google Tasks
    const googleTask = await tasksService.createTask(integration.taskListId, {
      title: assignment.title,
      notes: this.formatTaskNotes(assignment),
      due: assignment.dueDate?.toISOString(),
      status: "needsAction",
    });

    // Save to database
    await this.prisma.syncedTask.create({
      data: {
        canvasIntegrationId: integration.id,
        canvasEventId: assignment.id,
        googleTaskId: googleTask.id!,
        title: assignment.title,
        description: assignment.description || null,
        dueDate: assignment.dueDate || null,
        course: assignment.course || null,
        status: "needsAction",
      },
    });
  }

  private async updateTask(
    tasksService: GoogleTasksService,
    integration: any,
    existingTask: any,
    assignment: CanvasAssignment,
  ): Promise<void> {
    // Update task in Google Tasks
    await tasksService.updateTask(
      integration.taskListId,
      existingTask.googleTaskId,
      {
        title: assignment.title,
        notes: this.formatTaskNotes(assignment),
        due: assignment.dueDate?.toISOString(),
      },
    );

    // Update in database
    await this.prisma.syncedTask.update({
      where: { id: existingTask.id },
      data: {
        title: assignment.title,
        description: assignment.description || null,
        dueDate: assignment.dueDate || null,
        course: assignment.course || null,
      },
    });
  }

  private formatTaskNotes(assignment: CanvasAssignment): string {
    const notes: string[] = [];

    if (assignment.course) {
      notes.push(`Course: ${assignment.course}`);
    }

    if (assignment.description) {
      notes.push(`\n${assignment.description}`);
    }

    if (assignment.url) {
      notes.push(`\nCanvas URL: ${assignment.url}`);
    }

    notes.push(`\n🤖 Synced from Canvas`);

    return notes.join("");
  }

  private async cleanupOrphanedTasks(
    tasksService: GoogleTasksService,
    integration: any,
    currentAssignments: CanvasAssignment[],
    existingSyncedTasks: any[],
  ): Promise<void> {
    const currentAssignmentIds = new Set(currentAssignments.map((a) => a.id));

    // Find tasks that no longer exist in Canvas
    const orphanedTasks = existingSyncedTasks.filter(
      (task) => !currentAssignmentIds.has(task.canvasEventId),
    );

    // Only clean up tasks that are old (more than 7 days past due date)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const orphanedTask of orphanedTasks) {
      if (orphanedTask.dueDate && orphanedTask.dueDate < sevenDaysAgo) {
        try {
          // Delete from Google Tasks
          await tasksService.deleteTask(
            integration.taskListId,
            orphanedTask.googleTaskId,
          );

          // Delete from database
          await this.prisma.syncedTask.delete({
            where: { id: orphanedTask.id },
          });
        } catch (error) {
          console.error(
            `Failed to clean up orphaned task ${orphanedTask.id}:`,
            error,
          );
        }
      }
    }
  }
}
