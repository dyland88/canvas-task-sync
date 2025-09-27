"use client";

import { useState, useEffect } from "react";
import { AuthSection } from "./_components/AuthSection";
import { CanvasSection } from "./_components/CanvasSection";
import { TaskListSection } from "./_components/TaskListSection";
import { SyncSection } from "./_components/SyncSection";
import { Footer } from "./_components/Footer";

interface User {
  id: string;
  name: string | null;
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

  // Handle OAuth callback and restore user session
  useEffect(() => {
    const handleAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);

      // Handle OAuth success
      if (urlParams.get("auth") === "success") {
        const userId = urlParams.get("userId");
        const email = urlParams.get("email");
        const name = urlParams.get("name");

        if (userId && email) {
          const userData: User = {
            id: userId,
            email,
            name: name || null,
          };

          setUser(userData);
          setIsAuthenticated(true);

          // Store user in localStorage for persistence
          localStorage.setItem("canvas-sync-user", JSON.stringify(userData));

          // Clean up URL
          window.history.replaceState({}, "", window.location.pathname);
        }
      }

      // Handle OAuth errors
      else if (urlParams.get("error")) {
        console.error("OAuth error:", urlParams.get("error"));
        alert(
          `Authentication failed: ${urlParams.get("message") || urlParams.get("error")}`,
        );

        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      }

      // Restore user session from localStorage
      else {
        const savedUser = localStorage.getItem("canvas-sync-user");
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser) as User;
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Failed to parse saved user data:", error);
            localStorage.removeItem("canvas-sync-user");
          }
        }
      }
    };

    handleAuthCallback();
  }, []);

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

              if (authenticated && userData) {
                localStorage.setItem(
                  "canvas-sync-user",
                  JSON.stringify(userData),
                );
              } else {
                localStorage.removeItem("canvas-sync-user");
              }
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
              user={user}
            />
          )}

          {/* Sync Section */}
          {isAuthenticated && canvasUrl && selectedTaskList && (
            <SyncSection
              canvasUrl={canvasUrl}
              taskListId={selectedTaskList}
              syncStatus={syncStatus}
              onSyncStatusChange={setSyncStatus}
              user={user}
            />
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}
