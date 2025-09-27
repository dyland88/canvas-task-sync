import * as cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { SyncService } from "./sync";
import { GoogleOAuthService } from "./googleOAuth";
import { CanvasService } from "./canvas";

export class CronService {
  private syncService: SyncService;
  private prisma: PrismaClient;
  private isRunning = false;

  constructor() {
    this.prisma = new PrismaClient();
    const googleOAuth = new GoogleOAuthService();
    const canvasService = new CanvasService();
    this.syncService = new SyncService(this.prisma, googleOAuth, canvasService);
  }

  start(): void {
    // Run every 20 minutes
    cron.schedule("*/20 * * * *", async () => {
      if (this.isRunning) {
        console.log("Sync job already running, skipping...");
        return;
      }

      this.isRunning = true;

      try {
        console.log("Starting scheduled sync job...");
        await this.runSyncForAllUsers();
        console.log("Scheduled sync job completed successfully");
      } catch (error) {
        console.error("Scheduled sync job failed:", error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log("Cron service started - will sync every 20 minutes");
  }

  async runSyncForAllUsers(): Promise<void> {
    try {
      // Get all users with active integrations
      const users = await this.prisma.user.findMany({
        where: {
          canvasIntegrations: {
            some: {
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          email: true,
          canvasIntegrations: {
            where: { isActive: true },
            select: {
              id: true,
              taskListName: true,
              lastSyncAt: true,
            },
          },
        },
      });

      console.log(`Found ${users.length} users with active integrations`);

      let totalSyncs = 0;
      let successfulSyncs = 0;
      let failedSyncs = 0;

      // Process each user
      for (const user of users) {
        try {
          console.log(`Syncing integrations for user ${user.email}...`);

          const results = await this.syncService.syncUserIntegrations(user.id);

          for (const result of results) {
            totalSyncs++;

            if (result.status === "success") {
              successfulSyncs++;
              console.log(
                `✓ Sync successful: ${result.tasksCreated} created, ${result.tasksUpdated} updated, ${result.tasksSkipped} skipped`,
              );
            } else {
              failedSyncs++;
              console.log(
                `✗ Sync failed: ${result.message || "Unknown error"}`,
              );
              if (result.errors.length > 0) {
                console.log(`  Errors: ${result.errors.join(", ")}`);
              }
            }
          }
        } catch (error) {
          failedSyncs++;
          console.error(`Failed to sync user ${user.email}:`, error);
        }
      }

      console.log(
        `Sync summary: ${totalSyncs} total, ${successfulSyncs} successful, ${failedSyncs} failed`,
      );
    } catch (error) {
      console.error("Failed to run sync for all users:", error);
      throw error;
    }
  }

  async runSyncForUser(userId: string): Promise<void> {
    try {
      console.log(`Running manual sync for user ${userId}...`);
      const results = await this.syncService.syncUserIntegrations(userId);

      for (const result of results) {
        if (result.status === "success") {
          console.log(
            `✓ Manual sync successful: ${result.tasksCreated} created, ${result.tasksUpdated} updated`,
          );
        } else {
          console.log(
            `✗ Manual sync failed: ${result.message || "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      console.error(`Manual sync failed for user ${userId}:`, error);
      throw error;
    }
  }

  stop(): void {
    cron.getTasks().forEach((task) => task.stop());
    console.log("Cron service stopped");
  }
}
