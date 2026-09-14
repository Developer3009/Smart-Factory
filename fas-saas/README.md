# Smart Factory SaaS (FMS)

A multi-tenant, cloud-based Factory Management System (FMS) built for modern manufacturers. This application handles everything from work orders and inventory management to real-time machine monitoring and Quality Control (QC).

## Architecture

This is a modern, full-stack Next.js application designed for scale and multi-tenancy.

- **Framework**: Next.js 15+ (App Router)
- **Database**: PostgreSQL (via Supabase or Neon)
- **ORM**: Prisma
- **Authentication**: Clerk (B2B Multi-tenant Org implementation)
- **Styling**: Tailwind CSS & shadcn/ui
- **Caching & Queues**: Redis (via BullMQ)
- **Hardware Integration**: MQTT for real-time machine telemetry

### Multi-Tenancy
Data is strictly isolated per tenant using the `organizationId` foreign key mapped to Clerk Organizations. API routes utilize a central `getCurrentOrgId()` utility to automatically scope all reads and writes to the caller's tenant.

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. Supabase, Neon, or local Docker)
- A Clerk account for Authentication
- Redis (for caching and job queues)

### 2. Environment Setup
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env.local
```
*Note: See `.env.example` for details on required Clerk, Database, and Redis keys.*

### 3. Database Initialization
Push the Prisma schema to your database and run the seed script to populate default Roles and Downtime Codes:
```bash
npm install
npx prisma db push
npm run db:seed
```

### 4. Running the Development Server
Start the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application.

## Webhooks
To keep the database synchronized with Clerk (Users & Organizations), you must set up a Webhook in the Clerk Dashboard pointing to `/api/webhook/clerk` and subscribe to `organization.*`, `organizationMembership.*`, and `user.*` events. Ensure `CLERK_WEBHOOK_SECRET` is set in your environment.

## Testing & Validation
This project uses:
- **TypeScript** for static type checking
- **ESLint** for linting
- **Zod** for API input validation
- **Vitest** for unit and integration testing

To run the test suite:
```bash
npm run test
```
