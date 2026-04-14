# UWI Final Exam Scheduler — Frontend

A web application for scheduling and managing final exams at the University of the West Indies. The system provides an interactive drag-and-drop calendar, clash detection, venue management, split/merge exam workflows, and PDF export.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Key Concepts](#key-concepts)

---

## Tech Stack

| Category               | Library / Tool                  |
| ---------------------- | ------------------------------- |
| Framework              | Next.js 16 (App Router)         |
| Language               | TypeScript 5                    |
| State — server         | TanStack React Query 5          |
| State — client         | Zustand 5                       |
| Styling                | Tailwind CSS 4, Radix UI Themes |
| Animations             | Tailwind Motion                 |
| Icons                  | Lucide React, React Icons       |
| Drag & Drop            | @dnd-kit/core                   |
| Date Picker            | react-day-picker                |
| Select                 | react-select                    |
| Notifications          | react-hot-toast                 |
| File Uploads           | UploadThing + react-dropzone    |
| PDF Export             | jsPDF + jspdf-autotable         |
| Unit/Integration tests | Vitest + Testing Library        |
| E2E tests              | Playwright                      |
| Package manager        | pnpm                            |

---

## Project Structure

```
app/
├── (auth)/                   # Unauthenticated routes
│   ├── page.tsx              # Login page
│   └── layout.tsx
├── (app)/                    # Authenticated routes (protected)
│   ├── dashboard/            # Main exam calendar
│   ├── courses/              # Course listing with clash filtering
│   ├── course-clashes/       # Per-course clash matrix
│   ├── venues/               # Venue management
│   ├── upload/               # Dataset upload (CSV / PDF)
│   ├── activityLog/          # User activity log
│   └── layout.tsx            # Shared layout (sidebar, header)
├── api/
│   └── uploadthing/          # UploadThing API route
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── types/                # Shared TypeScript types
│   └── constants/            # Column definitions, nav items
├── hooks/                    # Custom React hooks
├── lib/                      # API fetch helpers & utilities
├── state_management/         # Zustand stores
├── providers.tsx             # React Query provider
└── globals.css               # Global styles & Tailwind imports

tests/
├── unit/                     # Vitest unit tests
│   ├── hooks/
│   ├── components/
│   ├── lib/
│   └── mocks/
├── integration/              # Vitest integration tests
│   ├── pages/
│   ├── components/
│   └── layout/
└── e2e/                      # Playwright end-to-end tests
    ├── auth.setup.ts         # Auth setup (runs once)
    ├── .auth/user.json       # Cached authenticated session
    └── *.spec.ts             # Feature specs
```

---

## Features

### Exam Calendar

- Interactive drag-and-drop scheduling across dates and time slots
- Assign exams to venues with real-time capacity tracking
- Move exams to a **reschedule queue** when a slot needs to be freed
- Visual capacity warnings when a venue is overbooked

### Split & Merge

- Split a single exam across multiple time slots or venues
- Merge splits back into a single exam when capacity allows
- Sibling splits track each other — moving one to reschedule moves the others

### Clash Detection

- Detects students enrolled in two or more conflicting courses
- Configurable **absolute** and **percentage** thresholds to filter noise
- Color-coded indicators: same-day-same-time, same-day, adjacent-day
- Clash matrix view per course and a global overview

### Data Management

- Browse all courses with enrollment counts
- Venue listing with capacities
- Upload datasets via drag-and-drop:
  - `Venues.csv`
  - `Courses.csv`
  - `Students.csv`
  - `Enrollments.csv`
  - `UWI Timetable Cross Reference.pdf`

### Activity Log

- All actions are logged client-side (login, uploads, exam moves, splits/merges)
- Logs expire automatically after 24 hours
- Each entry records the entity, old value, new value, and timestamp

### PDF Export

- Export the full exam schedule as a formatted PDF via jsPDF

---

## Prerequisites

- **Node.js** 18+
- **pnpm** (install with `npm i -g pnpm`)
- The **backend API** running — see [API Integration](#api-integration)

---

## Environment Variables

Create a `.env` file at the project root:

```env
# Exposed to the browser
NEXT_PUBLIC_API_BASE_URL_PROD=https://uwi-final-exam-scheduler.onrender.com
NEXT_PUBLIC_API_BASE_URL_LOCAL=http://localhost:8080
NEXT_PUBLIC_AUTH_COOKIE_NAME=access_token

# Build-time only (used in next.config.ts rewrites)
API_BASE_URL=http://localhost:8080

# JWT (used by middleware / token validation)
JWT_ALG=HS256
JWT_SECRET=<your-jwt-secret>

```

> Variables prefixed with `NEXT_PUBLIC_` are bundled into the client. All others are server-side only.

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. The app expects the backend API to be available at `http://localhost:8080` by default (configure via `API_BASE_URL`).

---

## Available Scripts

| Command                                  | Description                                  |
| ---------------------------------------- | -------------------------------------------- |
| `pnpm dev`                               | Start Next.js development server             |
| `pnpm build`                             | Production build                             |
| `pnpm start`                             | Run the production build                     |
| `pnpm lint`                              | Run ESLint                                   |
| `pnpm exec vitest run tests/unit`        | Run Vitest unit tests                        |
| `pnpm exec vitest run tests/integration` | Run Vitest integration tests                 |
| `pnpm e2e`                               | Run Playwright E2E tests (headless)          |
| `pnpm e2e:ui`                            | Run Playwright E2E tests with interactive UI |
| `pnpm e2e:report`                        | Open last Playwright HTML report             |

---

## API Integration

All requests are proxied through Next.js via a rewrite rule in [next.config.ts](next.config.ts):

```
/api/* → {API_BASE_URL}/api/*
```

Every request includes credentials (cookies) for session-based auth. The auth cookie name is configured via `NEXT_PUBLIC_AUTH_COOKIE_NAME`.

### Key Endpoints

| Method | Path                            | Description               |
| ------ | ------------------------------- | ------------------------- |
| `POST` | `/api/auth/login`               | Authenticate user         |
| `GET`  | `/api/auth/preferences`         | Load user preferences     |
| `GET`  | `/api/exams`                    | Fetch all exams           |
| `PUT`  | `/api/exams/:id`                | Update an exam            |
| `POST` | `/api/exams/:id/split`          | Split an exam             |
| `POST` | `/api/exams/merge`              | Merge exams               |
| `GET`  | `/api/courses`                  | List courses (paginated)  |
| `GET`  | `/api/venues`                   | List venues               |
| `GET`  | `/api/clash-matrix`             | Global clash matrix       |
| `GET`  | `/api/clash-matrix/:courseCode` | Clash matrix for a course |
| `POST` | `/api/upload`                   | Upload dataset files      |

---

## Testing

### Unit & Integration Tests (Vitest)

Tests live in [tests/unit/](tests/unit/) and [tests/integration/](tests/integration/).

```bash
pnpm exec vitest run tests/unit         # Unit tests only
pnpm exec vitest run tests/integration  # Integration tests only
```

- Environment: **jsdom**
- Setup file: [vitest.setup.ts](vitest.setup.ts) — mocks `matchMedia`, `ResizeObserver`, and suppresses known warnings
- Covers: hooks, components, utility functions, page renders, layout

### End-to-End Tests (Playwright)

Tests live in [tests/e2e/](tests/e2e/).

```bash
pnpm e2e          # Headless
pnpm e2e:ui       # Interactive UI mode
pnpm e2e:report   # View HTML report
```

- **Auth setup** runs once (`auth.setup.ts`) and caches the session to `tests/e2e/.auth/user.json`
- All subsequent specs reuse the cached auth state — no repeated logins
- Runs with a single worker (sequential) to avoid state conflicts
- The dev server (`pnpm dev`) is started automatically by Playwright

---

## Key Concepts

### Exam States

An exam can be in one of three states:

- **Scheduled** — assigned to a date, time slot, and venue on the calendar
- **Reschedule queue** — unscheduled, waiting to be placed
- **Split** — divided across multiple time slots/venues; each part is a sibling

### Clash Thresholds

Clash significance is filtered by two configurable thresholds (stored in Zustand + localStorage):

- **Absolute threshold** — minimum number of students affected
- **Percentage threshold** — minimum percentage of students in either course affected

### State Management

- **React Query** — server state (exams, courses, venues, clashes). Handles caching, invalidation, and refetching.
- **Zustand** (`examStore.ts`) — client-only UI state (selected exams, pending moves, drag state)
- **localStorage** — persists activity logs and user threshold preferences across sessions
