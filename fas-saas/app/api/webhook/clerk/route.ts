import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-errors'

export async function POST(req: Request) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      console.warn('Missing CLERK_WEBHOOK_SECRET in environment variables.');
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
    }

    const payload = await req.json()
    const body = JSON.stringify(payload);
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as unknown as WebhookEvent
    } catch (err) {
      console.error('Error verifying clerk webhook:', err);
      return NextResponse.json({ error: "Verification Failed" }, { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === 'organization.created' || eventType === 'organization.updated') {
      const { id, name } = evt.data;
      
      // Upsert the Organization in our DB
      const existing = await prisma.organization.findUnique({ where: { clerkOrgId: id } });
      if (existing) {
        await prisma.organization.update({
          where: { id: existing.id },
          data: { name }
        });
      } else {
        await prisma.organization.create({
          data: {
            clerkOrgId: id,
            name: name,
          }
        });
      }
    }

    if (eventType === 'organizationMembership.created' || eventType === 'organizationMembership.updated') {
      const { organization, public_user_data } = evt.data;
      
      const org = await prisma.organization.findUnique({
        where: { clerkOrgId: organization.id }
      });

      if (org && public_user_data) {
        const userId = public_user_data.user_id;
        // Check if user already exists in this org
        const existingUser = await prisma.orgUser.findFirst({
          where: { organizationId: org.id, clerkUserId: userId }
        });

        const fullName = [public_user_data.first_name, public_user_data.last_name].filter(Boolean).join(" ");
        const email = public_user_data.identifier || null;

        if (existingUser) {
          await prisma.orgUser.update({
            where: { id: existingUser.id },
            data: {
              name: fullName || "User",
              email: email
            }
          });
        } else {
          await prisma.orgUser.create({
            data: {
              organizationId: org.id,
              clerkUserId: userId,
              name: fullName || "User",
              email: email
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
