import * as ICAL from "ical";

export interface CanvasAssignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  course?: string;
  url?: string;
  startDate?: Date;
  endDate?: Date;
}

export class CanvasService {
  async fetchAndParseCalendar(
    calendarUrl: string,
  ): Promise<CanvasAssignment[]> {
    try {
      // Fetch the iCal data from Canvas
      const response = await fetch(calendarUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch calendar: ${response.status} ${response.statusText}`,
        );
      }

      const icalData = await response.text();

      // Parse the iCal data
      const parsed = ICAL.parseICS(icalData);

      // Extract assignments from the parsed data
      const assignments: CanvasAssignment[] = [];
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      for (const key in parsed) {
        const event = parsed[key];

        if (event && event.type === "VEVENT") {
          // Only include events that are assignments (due dates) and within 2 weeks
          if (event.summary && this.isAssignment(event)) {
            const dueDate = event.end || event.start;

            // Skip events without dates or events more than 2 weeks in the future
            if (!dueDate || dueDate > twoWeeksFromNow) {
              continue;
            }

            // Skip past events (more than 1 day old to account for timezone issues)
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            if (dueDate < oneDayAgo) {
              continue;
            }

            const assignment: CanvasAssignment = {
              id: event.uid || `${event.summary}-${dueDate?.getTime()}`,
              title: this.cleanTitle(event.summary),
              description: event.description
                ? this.cleanDescription(event.description)
                : undefined,
              dueDate,
              course: this.extractCourse(event.summary, event.description),
              url: event.url,
              startDate: event.start,
              endDate: event.end,
            };

            assignments.push(assignment);
          }
        }
      }

      // Sort by due date
      return assignments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    } catch (error) {
      console.error("Error fetching/parsing Canvas calendar:", error);
      throw new Error(
        `Failed to parse Canvas calendar: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private isAssignment(event: any): boolean {
    const summary = event.summary?.toLowerCase() || "";
    const description = event.description?.toLowerCase() || "";

    // Look for keywords that indicate this is an assignment
    const assignmentKeywords = [
      "assignment",
      "homework",
      "project",
      "essay",
      "report",
      "quiz",
      "exam",
      "test",
      "paper",
      "lab",
      "discussion",
      "due",
    ];

    // Check if it's a due date event (Canvas often prefixes with course codes)
    const isDueEvent =
      summary.includes("due") ||
      description.includes("due") ||
      event.categories?.includes("assignment");

    // Check for assignment keywords
    const hasAssignmentKeywords = assignmentKeywords.some(
      (keyword) => summary.includes(keyword) || description.includes(keyword),
    );

    return isDueEvent || hasAssignmentKeywords;
  }

  private cleanTitle(title: string): string {
    // Remove common Canvas prefixes and clean up the title
    return title
      .replace(/^\w+\s*[-:]\s*/, "") // Remove course code prefixes like "CS101: " or "MATH - "
      .replace(/\s*due\s*/gi, "") // Remove "due" text
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  private cleanDescription(description: string): string {
    return description
      .replace(/\\n/g, "\n") // Convert escaped newlines
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  private extractCourse(
    summary: string,
    description?: string,
  ): string | undefined {
    // Try to extract course name from summary (often prefixed)
    const courseMatch = summary.match(/^([A-Z]{2,5}\s*\d{3}[A-Z]?)\s*[-:]/);
    if (courseMatch) {
      return courseMatch[1];
    }

    // Try to extract from description
    if (description) {
      const descCourseMatch = description.match(/Course:\s*([^\n\r]+)/i);
      if (descCourseMatch && descCourseMatch[1]) {
        return descCourseMatch[1].trim();
      }
    } // Fallback: try to get first word(s) if they look like a course code
    const firstWords = summary.split(/\s+/).slice(0, 2).join(" ");
    if (/^[A-Z]{2,5}\s*\d{3}[A-Z]?/.test(firstWords)) {
      return firstWords;
    }

    return undefined;
  }

  async validateCanvasUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return (
        response.ok &&
        response.headers.get("content-type")?.includes("text/calendar") === true
      );
    } catch {
      return false;
    }
  }
}
