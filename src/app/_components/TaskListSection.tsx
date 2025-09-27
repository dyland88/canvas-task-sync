"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface TaskList {
  id: string;
  title: string;
  updated: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface TaskListSectionProps {
  selectedTaskList: string;
  onTaskListChange: (taskListId: string) => void;
  user: User | null;
}

export function TaskListSection({
  selectedTaskList,
  onTaskListChange,
  user,
}: TaskListSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskListName, setNewTaskListName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch task lists using TRPC
  const {
    data: taskListsData,
    isLoading,
    error,
    refetch,
  } = api.tasks.getTaskLists.useQuery(
    { userId: user?.id ?? "" },
    {
      enabled: !!user?.id,
      retry: false,
    },
  );

  const taskLists = taskListsData?.success ? taskListsData.taskLists : [];

  const createTaskListMutation = api.tasks.createTaskList.useMutation({
    onSuccess: (data) => {
      if (data.success && data.taskList) {
        onTaskListChange(data.taskList.id);
        setNewTaskListName("");
        setShowCreateForm(false);
        refetch(); // Refresh the task lists
      }
    },
    onError: (error) => {
      console.error("Failed to create task list:", error);
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  const handleCreateTaskList = async () => {
    if (!newTaskListName.trim() || !user?.id) return;

    setIsCreating(true);
    createTaskListMutation.mutate({
      userId: user.id,
      title: newTaskListName.trim(),
    });
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Google Task Lists
          </h3>
        </div>
        <p className="text-gray-600">
          Please authenticate with Google to view your task lists.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Google Task Lists
          </h3>
        </div>

        <div className="animate-pulse">
          <div className="mb-3 h-4 w-1/3 rounded bg-gray-200"></div>
          <div className="space-y-2">
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Google Task Lists
          </h3>
        </div>
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Failed to load task lists: {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Google Task Lists
          </h3>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          + Create New List
        </button>
      </div>

      <div className="space-y-4">
        {/* Create new task list form */}
        {showCreateForm && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newTaskListName}
                onChange={(e) => setNewTaskListName(e.target.value)}
                placeholder="Enter task list name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === "Enter" && handleCreateTaskList()}
              />
              <button
                onClick={handleCreateTaskList}
                disabled={isCreating || !newTaskListName.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTaskListName("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Task list selection */}
        <div>
          <label
            htmlFor="task-list-select"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Select a task list for your Canvas assignments:
          </label>
          <select
            id="task-list-select"
            value={selectedTaskList}
            onChange={(e) => onTaskListChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Choose a task list...</option>
            {taskLists.map((taskList) => (
              <option key={taskList.id} value={taskList.id}>
                {taskList.title}
              </option>
            ))}
          </select>
        </div>

        {/* Selected task list preview */}
        {selectedTaskList && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium text-green-900">
                Selected:{" "}
                {taskLists.find((tl) => tl.id === selectedTaskList)?.title}
              </span>
            </div>
            <p className="mt-1 text-sm text-green-700">
              Canvas assignments will be synced to this task list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
