# Canvas Task Sync - Backend Implementation

## 🚀 Backend Overview

The backend has been fully implemented with the following features:

### ⚡ Core Features

- **Automatic Sync**: Syncs Canvas assignments to Google Tasks every 20 minutes
- **Google OAuth Integration**: Secure authentication with Google accounts
- **Canvas Calendar Parsing**: Parses iCal feeds from Canvas to extract assignments
- **Smart Filtering**: Only syncs assignments within 2 weeks in the future
- **Duplicate Prevention**: Tracks synced tasks to avoid duplicates
- **Error Handling**: Comprehensive error logging and recovery

### 🏗️ Architecture

#### Services Layer

- **GoogleOAuthService**: Handles Google OAuth flow and token management
- **GoogleTasksService**: Manages Google Tasks API operations
- **CanvasService**: Parses Canvas iCal calendar feeds
- **SyncService**: Core sync logic between Canvas and Google Tasks
- **CronService**: Automated background syncing every 20 minutes

#### Database Schema (Prisma)

- **User**: Stores user info and Google OAuth tokens
- **CanvasIntegration**: Links users to their Canvas calendars and task lists
- **SyncedTask**: Tracks individual synced assignments
- **SyncLog**: Maintains sync history and error logs

#### API Endpoints (tRPC)

- **auth**: Authentication and user management
- **canvas**: Canvas integration and validation
- **tasks**: Google Tasks management
- **sync**: Manual and automated syncing

## 🔧 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Admin key for sync operations
ADMIN_KEY="your-secure-admin-key"

# Database
DATABASE_URL="file:./db.sqlite"
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Tasks API
   - Google OAuth2 API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to your `.env` file

### 3. Database Setup

The database has already been migrated. To reset or re-migrate:

```bash
npx prisma migrate reset
npx prisma migrate dev --name your-migration-name
```

### 4. Start the Application

```bash
npm run dev
```

The cron service will automatically start when the server starts.

## 📋 API Usage Examples

### Authentication Flow

```typescript
import { useGoogleAuth } from "~/lib/api-hooks";

const { initiateGoogleLogin, completeGoogleAuth } = useGoogleAuth();

// 1. Start OAuth flow
initiateGoogleLogin();

// 2. Handle callback (with code from URL params)
const result = await completeGoogleAuth(authCode);
```

### Canvas Integration

```typescript
import { useCanvas } from "~/lib/api-hooks";

const { validateCanvasUrl, createIntegration } = useCanvas();

// 1. Validate Canvas URL
const validation = await validateCanvasUrl(
  "https://school.instructure.com/feeds/calendars/user_123.ics",
);

// 2. Create integration
if (validation.valid) {
  await createIntegration({
    userId: "user-id",
    canvasUrl: "canvas-calendar-url",
    taskListId: "google-task-list-id",
    taskListName: "My Tasks",
  });
}
```

### Manual Sync

```typescript
import { useSync } from "~/lib/api-hooks";

const { syncUser, getSyncStatus } = useSync();

// Trigger manual sync
const results = await syncUser("user-id");

// Check sync status
const status = getSyncStatus("user-id");
```

## 🔄 Automatic Sync Process

### How It Works

1. **Cron Job**: Runs every 20 minutes
2. **User Discovery**: Finds all users with active Canvas integrations
3. **Token Refresh**: Automatically refreshes expired Google tokens
4. **Canvas Parsing**: Downloads and parses iCal feeds from Canvas
5. **Assignment Filtering**:
   - Only includes assignments (not other calendar events)
   - Filters to assignments due within 2 weeks
   - Skips assignments more than 1 day overdue
6. **Task Management**:
   - Creates new tasks for new assignments
   - Updates existing tasks if changed
   - Skips unchanged tasks
   - Cleans up old completed tasks (after 7 days)
7. **Error Handling**: Logs all errors and continues with other users

### Assignment Detection

The system identifies Canvas assignments by looking for:

- Events with "due" in the title or description
- Events with assignment-related keywords (homework, project, essay, etc.)
- Events categorized as assignments

### Task Formatting

Each synced task includes:

- **Title**: Clean assignment name (course prefix removed)
- **Due Date**: Original Canvas due date
- **Notes**: Course name, description, and Canvas URL
- **Status**: Always starts as "needsAction"

## 🛠️ Development Tools

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Manual Testing

```bash
# Trigger global sync (requires ADMIN_KEY)
curl -X POST http://localhost:3000/api/trpc/sync.triggerGlobalSync \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your-admin-key"}'

# Get sync statistics
curl -X GET http://localhost:3000/api/trpc/sync.getGlobalSyncStats \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your-admin-key"}'
```

### Logs and Monitoring

- Sync operations are logged to the console
- Database sync logs provide detailed history
- Error tracking in `SyncLog` table

## 🔐 Security Considerations

- Google OAuth tokens are automatically refreshed
- Sensitive data is stored securely in the database
- Admin endpoints require authentication keys
- User data is isolated per user account

## 📊 Performance Features

- **Efficient Parsing**: Only processes changed assignments
- **Token Caching**: Reuses valid Google tokens
- **Batch Operations**: Processes multiple users efficiently
- **Error Recovery**: Continues processing other users if one fails
- **Cleanup**: Removes old completed tasks to prevent bloat

## 🧪 Testing the Backend

1. **Authentication**: Test Google OAuth flow
2. **Canvas Integration**: Try with a real Canvas calendar URL
3. **Manual Sync**: Trigger sync and check Google Tasks
4. **Automatic Sync**: Wait 20 minutes or check logs

The backend is now fully functional and ready for production use! 🎉
