"use client";

import { useState } from "react";
import { AuthSection } from "./_components/AuthSection";
import { CanvasSection } from "./_components/CanvasSection";
import { TaskListSection } from "./_components/TaskListSection";
import { SyncSection } from "./_components/SyncSection";
import { Footer } from "./_components/Footer";

interface User {
  name: string;
  email: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [selectedTaskList, setSelectedTaskList] = useState("");
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Canvas Task Sync
          </h1>
          <p className="text-lg text-gray-600">
            Sync your Canvas assignments to Google Tasks effortlessly
          </p>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Authentication Section */}
          <AuthSection
            isAuthenticated={isAuthenticated}
            user={user}
            onAuthStateChange={(
              authenticated: boolean,
              userData: User | null,
            ) => {
              setIsAuthenticated(authenticated);
              setUser(userData);
            }}
          />

          {/* Canvas Configuration Section */}
          {isAuthenticated && (
            <CanvasSection
              canvasUrl={canvasUrl}
              onCanvasUrlChange={setCanvasUrl}
            />
          )}

          {/* Task List Selection Section */}
          {isAuthenticated && canvasUrl && (
            <TaskListSection
              selectedTaskList={selectedTaskList}
              onTaskListChange={setSelectedTaskList}
            />
          )}

          {/* Sync Section */}
          {isAuthenticated && canvasUrl && selectedTaskList && (
            <SyncSection
              canvasUrl={canvasUrl}
              taskListId={selectedTaskList}
              syncStatus={syncStatus}
              onSyncStatusChange={setSyncStatus}
            />
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}
