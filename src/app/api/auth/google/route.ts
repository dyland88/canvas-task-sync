import { NextResponse } from "next/server";
import { GoogleOAuthService } from "~/server/services/googleOAuth";

const googleOAuth = new GoogleOAuthService();

export async function GET() {
  try {
    console.log("Generating Google OAuth URL...");
    const authUrl = googleOAuth.getAuthUrl();
    console.log("OAuth URL generated:", authUrl);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Failed to generate OAuth URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 },
    );
  }
}
