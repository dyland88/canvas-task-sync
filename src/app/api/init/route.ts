import { initializeServices } from "~/server/init";

// Initialize services when the module is loaded
if (process.env.NODE_ENV !== "test") {
  initializeServices();
}

// This is a dummy API route to ensure the initialization happens
import { type NextRequest } from "next/server";

export async function GET() {
  return Response.json({
    message: "Canvas Task Sync services are running",
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return Response.json({
    message: "Canvas Task Sync services are running",
    timestamp: new Date().toISOString(),
  });
}
