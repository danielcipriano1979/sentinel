# Sentinel - Infrastructure Monitoring System

## Overview

Sentinel is a multi-tenant infrastructure monitoring system designed to track hosts, agents, and system resources in real-time. The application enables organizations to monitor their infrastructure health, view detailed metrics (CPU, memory, disk usage), track agent status, and manage custom fields for hosts. Built with a focus on professional data visualization and scan-ability, it provides both overview dashboards and detailed host-level insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter is used for client-side routing, providing a lightweight alternative to React Router. Routes are defined in `App.tsx` and include dashboard, hosts list, host detail, agents, roadmap, and settings pages.

**State Management**: 
- **React Query (TanStack Query)** manages server state, API calls, and caching with automatic refetching every 5 seconds for real-time data updates
- **React Context** handles organization selection and theme preferences
- Local storage persists the current organization selection and theme choice across sessions

**UI Component Library**: Shadcn/ui with Radix UI primitives provides accessible, customizable components. The design follows a "new-york" style with neutral color scheme and CSS variables for theming.

**Styling**: Tailwind CSS with a custom design system inspired by Signoz, emphasizing data-first presentation. The design uses Inter for UI text and JetBrains Mono for metrics/monospace content. Custom CSS variables enable light/dark mode theming with hover and active elevation effects for interactive elements.

**Charts**: Recharts library renders time-series metrics visualizations with area charts for resource usage over time.

### Backend Architecture

**Framework**: Express.js server with TypeScript running on Node.js.

**API Design**: RESTful API endpoints organized in `server/routes.ts`:
- `/api/organizations` - Organization (tenant) management
- `/api/hosts` - Host registration and retrieval
- `/api/agents` - Agent status and version tracking
- `/api/dashboard` - Aggregated dashboard statistics

**Request Handling**: JSON body parsing with raw body preservation for webhook-style integrations. Request logging middleware tracks response times and status codes.

**Storage Layer**: Abstract storage interface (`IStorage`) defined in `server/storage.ts` provides separation between business logic and data access, enabling future backend swaps.

**In-Memory Metrics Store**: Real-time metrics (CPU, memory, disk usage) are stored in-memory rather than persisted to the database, optimizing for high-frequency updates and reducing database load.

### Database & ORM

**Database**: PostgreSQL via Neon serverless with WebSocket connections for serverless deployment compatibility.

**ORM**: Drizzle ORM provides type-safe database queries with schema-first design. Schema is defined in `shared/schema.ts` using Drizzle's declarative table definitions.

**Schema Design**:
- **Multi-tenancy**: Organizations table provides tenant isolation with slug-based identification
- **Hosts**: Store machine information with relationships to organizations, support for tags and custom JSON fields
- **Agents**: Separate table tracks agent versions, status, and heartbeat timestamps with one-to-one relationship to hosts
- **Custom Field Definitions**: Allow organizations to define metadata schemas for their hosts
- **Roadmap Items**: Support feature planning and status tracking

**Migrations**: Managed through Drizzle Kit with configuration in `drizzle.config.ts`.

### Multi-Tenancy Design

Organizations serve as the primary tenant boundary. All major entities (hosts, agents, custom field definitions) are scoped to an organization via foreign keys with cascade deletion. The frontend maintains current organization context through React Context, and all API requests filter data by organization ID. Users can switch between organizations via a dropdown in the sidebar.

### Build & Deployment

**Development**: Vite dev server with HMR runs alongside Express backend. The Vite middleware is integrated into Express for seamless development experience.

**Production Build**: 
- Frontend: Vite bundles React app to `dist/public`
- Backend: esbuild bundles server code to a single `dist/index.cjs` file with selective dependency bundling (whitelisted packages are bundled, others remain external)
- The production server serves static frontend assets from the `dist/public` directory

**Build Script**: `script/build.ts` orchestrates both frontend and backend builds, selectively bundling frequently-used dependencies to reduce file system calls and improve cold start times.

## External Dependencies

### Core Infrastructure

- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connection support
- **Drizzle ORM**: Type-safe database queries and schema management
- **Express.js**: HTTP server and API routing

### UI Framework & Components

- **React 18**: Frontend framework with hooks and concurrent rendering
- **Vite**: Build tool and development server with hot module replacement
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible primitive components for complex UI patterns
- **Recharts**: Charting library for metrics visualization
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority & clsx**: Component variant styling utilities

### Form Handling & Validation

- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for forms and API requests
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Date & Time

- **date-fns**: Date formatting and manipulation utilities

### Development Tools

- **TypeScript**: Static typing for JavaScript
- **esbuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing pipeline
- **tsx**: TypeScript execution for development and build scripts