import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { GoogleOAuthService } from "~/server/services/googleOAuth";

const googleOAuth = new GoogleOAuthService();

export const authRouter = createTRPCRouter({
  getGoogleAuthUrl: publicProcedure.query(() => {
    return {
      url: googleOAuth.getAuthUrl(),
    };
  }),

  authenticateWithGoogle: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Exchange code for tokens
        const tokens = await googleOAuth.getTokens(input.code);

        // Get user info from Google
        const userInfo = await googleOAuth.getUserInfo(tokens.access_token);

        // Create or update user in database
        const user = await ctx.db.user.upsert({
          where: { googleId: userInfo.id },
          update: {
            email: userInfo.email,
            name: userInfo.name,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            tokenExpiry: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : null,
          },
          create: {
            googleId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token!,
            tokenExpiry: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : null,
          },
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      } catch (error) {
        console.error("Google authentication failed:", error);
        throw new Error("Authentication failed");
      }
    }),

  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return user;
    }),

  logout: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // In a real app, you might want to revoke the Google tokens
      // For now, we'll just return success
      return { success: true };
    }),
});
