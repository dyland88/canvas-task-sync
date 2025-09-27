# Canvas Task Sync

A modern web application that seamlessly syncs your Canvas assignments to Google Tasks, helping you stay organized and never miss a deadline.

## Features

- **Google Authentication**: Secure sign-in with your Google account
- **Canvas Integration**: Connect your Canvas calendar feed to fetch assignments
- **Task List Management**: Choose existing Google Task lists or create new ones
- **Smart Filtering**: Filter assignments by date range, course, and completion status
- **Batch Operations**: Select and sync multiple assignments at once
- **Real-time Status**: Live updates on sync progress and results
- **Responsive Design**: Beautiful interface that works on desktop and mobile

## Tech Stack

This is a [T3 Stack](https://create.t3.gg/) project built with:

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: tRPC, Prisma
- **Database**: SQLite (development)
- **Authentication**: Ready for Google OAuth integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google account for authentication
- Access to your Canvas calendar feed URL

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd canvas-task-sync
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) (or the port shown in terminal) to view the application.

## How to Use

### 1. Authentication

- Click "Sign in with Google" to authenticate with your Google account
- This will grant access to your Google Tasks

### 2. Canvas Setup

- Navigate to your Canvas Dashboard
- Go to Calendar → Calendar Feed (bottom right)
- Copy the calendar feed URL
- Paste it into the Canvas Calendar URL field

### 3. Task List Selection

- Choose an existing Google Task list from the dropdown
- Or create a new task list specifically for Canvas assignments

### 4. Sync Assignments

- Click "Preview Assignments" to see available Canvas assignments
- Use filters to narrow down assignments by date range or completion status
- Select the assignments you want to sync
- Click "Sync" to add them to your Google Tasks

## Backend Integration

The frontend is ready for backend integration. You'll need to implement:

### Google APIs

- **Google OAuth 2.0**: For user authentication
- **Google Tasks API**: For managing task lists and tasks

### Canvas Integration

- **Calendar Feed Parsing**: Parse iCalendar (.ics) format
- **Assignment Extraction**: Extract assignment details from calendar events

### Suggested Backend Endpoints

```typescript
// Authentication
POST /api/auth/google
GET  /api/auth/me
POST /api/auth/logout

// Canvas
POST /api/canvas/validate-url
GET  /api/canvas/assignments

// Google Tasks
GET  /api/tasks/lists
POST /api/tasks/lists
GET  /api/tasks/:listId
POST /api/tasks/:listId/sync
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="file:./db.sqlite"

# Google OAuth (when implementing backend)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth (when implementing authentication)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format:write

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/
│   ├── _components/          # React components
│   │   ├── AuthSection.tsx   # Google authentication
│   │   ├── CanvasSection.tsx # Canvas URL input
│   │   ├── TaskListSection.tsx # Google Tasks management
│   │   ├── SyncSection.tsx   # Assignment sync interface
│   │   └── Footer.tsx        # Footer component
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── server/                   # tRPC server setup
└── styles/                   # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is not affiliated with Instructure Inc. (Canvas) or Google LLC. It's an independent tool designed to help students manage their assignments more effectively.
