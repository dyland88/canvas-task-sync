import { NextRequest, NextResponse } from "next/server";
import { GoogleOAuthService } from "~/server/services/googleOAuth";
import { db } from "~/server/db";

const googleOAuth = new GoogleOAuthService();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  // Handle missing code
  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    console.log("Exchanging code for tokens...");
    const tokens = await googleOAuth.getTokens(code);
    console.log("Tokens received successfully");

    // Get user info from Google
    console.log("Fetching user info...");
    const userInfo = await googleOAuth.getUserInfo(tokens.access_token);
    console.log("User info received:", {
      id: userInfo.id,
      email: userInfo.email,
    });

    // Create or update user in database
    console.log("Creating/updating user in database...");
    const user = await db.user.upsert({
      where: { googleId: userInfo.id },
      update: {
        email: userInfo.email,
        name: userInfo.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    console.log("User saved to database:", user.id);

    // Redirect to frontend with user info in URL params
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("auth", "success");
    redirectUrl.searchParams.set("userId", user.id);
    redirectUrl.searchParams.set("email", user.email);
    redirectUrl.searchParams.set("name", user.name || "");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth callback error:", error);

    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("error", "auth_failed");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.redirect(redirectUrl);
  }
}
