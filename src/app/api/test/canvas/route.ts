import { NextRequest, NextResponse } from "next/server";
import { CanvasService } from "~/server/services/canvas";

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url: string };

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const canvasService = new CanvasService();

    // Test URL validation
    const isValid = await canvasService.validateCanvasUrl(url);

    if (!isValid) {
      return NextResponse.json({
        valid: false,
        message: "Invalid Canvas calendar URL",
      });
    }

    // Test assignment parsing
    const assignments = await canvasService.fetchAndParseCalendar(url);

    return NextResponse.json({
      valid: true,
      message: "Canvas calendar parsed successfully",
      assignmentCount: assignments.length,
      assignments: assignments.slice(0, 5).map((a) => ({
        title: a.title,
        course: a.course,
        dueDate: a.dueDate?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Canvas test failed:", error);
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to parse Canvas calendar",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Canvas Test API - Send POST request with Canvas calendar URL",
    example: {
      method: "POST",
      body: {
        url: "https://your-school.instructure.com/feeds/calendars/user_xxx.ics",
      },
    },
  });
}
