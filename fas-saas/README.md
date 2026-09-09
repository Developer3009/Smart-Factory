# Factory Management System

Multi-tenant factory management SaaS built with Next.js, Clerk, Prisma, and PostgreSQL.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set real Clerk keys and a reachable PostgreSQL `DATABASE_URL`.
3. Set `SAAS_ADMIN_CLERK_USER_IDS` to one or more Clerk user IDs.
4. Install and run:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Deploy on Vercel

Deploy the `fas-saas` directory as a Next.js project on Vercel. Required environment variables are:

- `DATABASE_URL`: pooled PostgreSQL connection for runtime requests
- `DIRECT_URL`: direct PostgreSQL connection for Prisma CLI/migrations
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `SAAS_ADMIN_CLERK_USER_IDS`
- `NEXT_PUBLIC_APP_URL`: deployed application URL

`vercel.json` runs `prisma generate && next build` during deployment. Run `npm run build` locally before publishing.

## Tenant and Clerk integration

Organizations must be created through the SaaS Admin dashboard. The API creates the organization in Clerk and stores its `clerkOrgId` in Prisma. Adding or changing a member also updates the matching Clerk organization membership.

Organization admins and members can access only their active organization. Only SaaS admins can create or switch between organizations.

Existing database organizations created before Clerk integration need a one-time `clerkOrgId` backfill before their users can log in through Clerk.
