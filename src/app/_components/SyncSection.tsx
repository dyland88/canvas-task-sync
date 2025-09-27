"use client";

import { useState } from "react";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  course: string;
  description?: string;
}

interface SyncSectionProps {
  canvasUrl: string;
  taskListId: string;
  syncStatus: "idle" | "syncing" | "success" | "error";
  onSyncStatusChange: (
    status: "idle" | "syncing" | "success" | "error",
  ) => void;
}

export function SyncSection({
  canvasUrl,
  taskListId,
  syncStatus,
  onSyncStatusChange,
}: SyncSectionProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    dateRange: "upcoming", // "all", "upcoming", "this_week", "custom"
    courses: [] as string[],
    includeCompleted: false,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handlePreviewAssignments = async () => {
    onSyncStatusChange("syncing");

    try {
      // TODO: Replace with actual Canvas API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock assignments data
      const mockAssignments: Assignment[] = [
        {
          id: "1",
          title: "Math Homework Chapter 5",
          dueDate: "2024-01-20T23:59:00",
          course: "Mathematics 101",
          description: "Complete exercises 1-20 from chapter 5",
        },
        {
          id: "2",
          title: "History Essay",
          dueDate: "2024-01-22T11:59:00",
          course: "World History",
          description: "Write a 1000-word essay on the Industrial Revolution",
        },
        {
          id: "3",
          title: "Science Lab Report",
          dueDate: "2024-01-25T17:00:00",
          course: "Chemistry 101",
          description: "Submit lab report for experiment conducted on Jan 15",
        },
        {
          id: "4",
          title: "Programming Project",
          dueDate: "2024-01-28T23:59:00",
          course: "Computer Science",
          description: "Build a simple web application using React",
        },
      ];

      setAssignments(mockAssignments);
      setSelectedAssignments(mockAssignments.map((a) => a.id));
      onSyncStatusChange("idle");
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      onSyncStatusChange("error");
    }
  };

  const handleSync = async () => {
    if (selectedAssignments.length === 0) return;

    onSyncStatusChange("syncing");
    setSyncResults(null);

    try {
      // TODO: Replace with actual sync implementation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock sync results
      const successful = selectedAssignments.length;
      const failed = 0;

      setSyncResults({
        successful,
        failed,
        errors: [],
      });

      setLastSyncTime(new Date());
      onSyncStatusChange("success");
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncResults({
        successful: 0,
        failed: selectedAssignments.length,
        errors: ["Failed to sync assignments to Google Tasks"],
      });
      onSyncStatusChange("error");
    }
  };

  const handleAssignmentToggle = (assignmentId: string) => {
    setSelectedAssignments((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center">
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <svg
            className="h-5 w-5 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Sync Assignments
        </h3>
      </div>

      {/* Filter Options */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-700">
          Filter Options
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Date Range
            </label>
            <select
              value={filterOptions.dateRange}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  dateRange: e.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="upcoming">Upcoming Only</option>
              <option value="this_week">This Week</option>
              <option value="all">All Assignments</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-completed"
              checked={filterOptions.includeCompleted}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  includeCompleted: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="include-completed"
              className="ml-2 text-xs font-medium text-gray-600"
            >
              Include completed assignments
            </label>
          </div>
        </div>
      </div>

      {/* Preview/Sync Actions */}
      <div className="mb-6 flex space-x-3">
        <button
          onClick={handlePreviewAssignments}
          disabled={syncStatus === "syncing"}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncStatus === "syncing" && assignments.length === 0 ? (
            <>
              <svg
                className="mr-2 -ml-1 inline h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading Assignments...
            </>
          ) : (
            "Preview Assignments"
          )}
        </button>

        {assignments.length > 0 && (
          <button
            onClick={handleSync}
            disabled={
              syncStatus === "syncing" || selectedAssignments.length === 0
            }
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncStatus === "syncing" && assignments.length > 0 ? (
              <>
                <svg
                  className="mr-2 -ml-1 inline h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Syncing...
              </>
            ) : (
              `Sync ${selectedAssignments.length} Assignment${selectedAssignments.length !== 1 ? "s" : ""}`
            )}
          </button>
        )}
      </div>

      {/* Assignments List */}
      {assignments.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Assignments ({assignments.length} found)
            </h4>
            <div className="text-xs text-gray-500">
              {selectedAssignments.length} selected
            </div>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  selectedAssignments.includes(assignment.id)
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleAssignmentToggle(assignment.id)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(assignment.id)}
                    onChange={() => handleAssignmentToggle(assignment.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="truncate text-sm font-medium text-gray-900">
                        {assignment.title}
                      </h5>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          isOverdue(assignment.dueDate)
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isOverdue(assignment.dueDate) ? "Overdue" : "Due"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {assignment.course}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Due: {formatDueDate(assignment.dueDate)}
                    </p>
                    {assignment.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Results */}
      {syncResults && (
        <div
          className={`rounded-lg p-4 ${
            syncResults.failed === 0
              ? "border border-green-200 bg-green-50"
              : "border border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center">
            {syncResults.failed === 0 ? (
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
            ) : (
              <svg
                className="mr-2 h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  syncResults.failed === 0 ? "text-green-900" : "text-red-900"
                }`}
              >
                Sync {syncResults.failed === 0 ? "Completed" : "Failed"}
              </p>
              <p
                className={`text-xs ${
                  syncResults.failed === 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {syncResults.successful} successful, {syncResults.failed} failed
              </p>
            </div>
          </div>

          {syncResults.errors.length > 0 && (
            <div className="mt-2">
              {syncResults.errors.map((error, index) => (
                <p key={index} className="text-xs text-red-700">
                  • {error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last Sync Info */}
      {lastSyncTime && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Last synced: {lastSyncTime.toLocaleString()}
        </div>
      )}
    </div>
  );
}
