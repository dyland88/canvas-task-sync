"use client";

import { useState } from "react";

interface CanvasSectionProps {
  canvasUrl: string;
  onCanvasUrlChange: (url: string) => void;
}

export function CanvasSection({
  canvasUrl,
  onCanvasUrlChange,
}: CanvasSectionProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validateCanvasUrl = async (url: string) => {
    if (!url.trim()) {
      setValidationStatus("idle");
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    try {
      // Basic URL validation
      const urlObj = new URL(url);

      // Check if it's a Canvas calendar URL pattern
      if (!url.includes("calendar") || !url.includes("ics")) {
        throw new Error(
          "Please provide a valid Canvas calendar URL (should contain 'calendar' and end with '.ics')",
        );
      }

      // TODO: Implement actual Canvas URL validation
      // This is just a mock implementation for the frontend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setValidationStatus("valid");
    } catch (error) {
      setValidationStatus("invalid");
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid Canvas calendar URL",
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onCanvasUrlChange(url);

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateCanvasUrl(url);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center">
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
          <svg
            className="h-5 w-5 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10h10V11m-8 0h6m-3-4V3"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Canvas Calendar</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="canvas-url"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Canvas Calendar URL
          </label>
          <div className="relative">
            <input
              type="url"
              id="canvas-url"
              value={canvasUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://your-school.instructure.com/feeds/calendars/user_xxx.ics"
              className={`w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                validationStatus === "valid"
                  ? "border-green-300 focus:ring-green-500"
                  : validationStatus === "invalid"
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
              }`}
            />

            {/* Status indicator */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValidating && (
                <svg
                  className="h-4 w-4 animate-spin text-gray-400"
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
              )}
              {!isValidating && validationStatus === "valid" && (
                <svg
                  className="h-4 w-4 text-green-400"
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
              )}
              {!isValidating && validationStatus === "invalid" && (
                <svg
                  className="h-4 w-4 text-red-400"
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
            </div>
          </div>

          {errorMessage && (
            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
          )}

          {validationStatus === "valid" && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Canvas calendar URL is valid
            </p>
          )}
        </div>

        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">
                How to find your Canvas calendar URL:
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <ol className="list-inside list-decimal space-y-1">
                  <li>Go to your Canvas Dashboard</li>
                  <li>Click on "Calendar" in the left navigation</li>
                  <li>Click on "Calendar Feed" at the bottom right</li>
                  <li>Copy the calendar feed URL and paste it above</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
