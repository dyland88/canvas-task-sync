import { google, tasks_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface TaskList {
  id: string;
  title: string;
  updated: string;
}

export interface Task {
  id?: string;
  title: string;
  notes?: string;
  due?: string;
  status?: "needsAction" | "completed";
}

export class GoogleTasksService {
  private tasks: tasks_v1.Tasks;

  constructor(authClient: OAuth2Client) {
    this.tasks = google.tasks({ version: "v1", auth: authClient });
  }

  async getTaskLists(): Promise<TaskList[]> {
    const response = await this.tasks.tasklists.list();

    return (response.data.items || []).map((item) => ({
      id: item.id!,
      title: item.title!,
      updated: item.updated!,
    }));
  }

  async createTaskList(title: string): Promise<TaskList> {
    const response = await this.tasks.tasklists.insert({
      requestBody: {
        title,
      },
    });

    return {
      id: response.data.id!,
      title: response.data.title!,
      updated: response.data.updated!,
    };
  }

  async getTasks(taskListId: string): Promise<Task[]> {
    const response = await this.tasks.tasks.list({
      tasklist: taskListId,
      showCompleted: true,
      showDeleted: false,
    });

    return (response.data.items || []).map((item) => ({
      id: item.id!,
      title: item.title!,
      notes: item.notes || undefined,
      due: item.due || undefined,
      status: (item.status as "needsAction" | "completed") || "needsAction",
    }));
  }

  async createTask(taskListId: string, task: Task): Promise<Task> {
    const response = await this.tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: {
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status || "needsAction",
      },
    });

    return {
      id: response.data.id!,
      title: response.data.title!,
      notes: response.data.notes || undefined,
      due: response.data.due || undefined,
      status:
        (response.data.status as "needsAction" | "completed") || "needsAction",
    };
  }

  async updateTask(
    taskListId: string,
    taskId: string,
    task: Partial<Task>,
  ): Promise<Task> {
    const response = await this.tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status,
      },
    });

    return {
      id: response.data.id!,
      title: response.data.title!,
      notes: response.data.notes || undefined,
      due: response.data.due || undefined,
      status:
        (response.data.status as "needsAction" | "completed") || "needsAction",
    };
  }

  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.tasks.tasks.delete({
      tasklist: taskListId,
      task: taskId,
    });
  }
}
