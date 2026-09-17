import { Resend } from 'resend';
import { Customer, Vendor, SalesOrder, PurchaseOrder } from '@prisma/client';
import { prisma } from './prisma';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'orders@antigravity-erp.com';

async function sendEmailAndLog(options: {
  organizationId: string;
  orderId: string;
  orderType: 'SALES' | 'PURCHASE';
  to: string;
  subject: string;
  html: string;
  emailType: 'ORDER_CONFIRMED' | 'ORDER_DECLINED' | 'INTERNAL_ALERT';
}) {
  const { organizationId, orderId, orderType, to, subject, html, emailType } = options;
  let status = "SENT";
  let errorMsg = null;

  try {
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_123")) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
    } else {
      console.log(`Mock Email (${emailType}) to ${to}:`, { subject });
    }
  } catch (err: any) {
    status = "FAILED";
    errorMsg = err.message || "Unknown error";
    console.error('Failed to send email:', err);
  }

  // Always log
  await prisma.emailLog.create({
    data: {
      organizationId,
      orderId,
      orderType,
      recipientEmail: to,
      emailType,
      status,
      error: errorMsg,
    }
  });
}

async function notifyAdmins(organizationId: string, subject: string, html: string, orderId: string, orderType: 'SALES' | 'PURCHASE') {
  // Find admins
  const admins = await prisma.orgUser.findMany({
    where: {
      organizationId,
      OR: [
        { role: { in: ['ADMIN', 'PLANT_MANAGER'] } },
        { factoryRoles: { some: { role: { name: { in: ['ADMIN', 'PLANT_MANAGER'] } } } } }
      ]
    },
    select: { email: true }
  });

  const emails = admins.map(a => a.email).filter(Boolean) as string[];
  const uniqueEmails = Array.from(new Set(emails));

  for (const email of uniqueEmails) {
    await sendEmailAndLog({
      organizationId,
      orderId,
      orderType,
      to: email,
      subject: `[Internal Alert] ${subject}`,
      html: `<div style="padding: 20px; font-family: sans-serif; background: #f9f9f9; border-left: 4px solid #333;">
        <h3>Internal Order Notification</h3>
        ${html}
      </div>`,
      emailType: 'INTERNAL_ALERT',
    });
  }
}

/**
 * Sends a transactional email to a Customer regarding a Sales Order
 */
export async function sendSalesOrderEmail(
  order: SalesOrder,
  customer: Customer,
  status: 'CONFIRMED' | 'DECLINED'
) {
  if (!customer.email) return;

  const subject = status === 'CONFIRMED' 
    ? `Your Order #${order.id} has been Confirmed`
    : `Update regarding your Order #${order.id}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Order ${status === 'CONFIRMED' ? 'Confirmed' : 'Declined'}</h2>
      <p>Dear ${customer.name},</p>
      <p>We are writing to inform you that your Sales Order <strong>#${order.id}</strong> for <strong>$${order.amount}</strong> has been <strong>${status}</strong>.</p>
      ${status === 'CONFIRMED' 
        ? '<p>We will begin processing your order immediately. Thank you for your business!</p>' 
        : '<p>If you have any questions regarding this decision, please contact our support team.</p>'}
      <br />
      <p>Best regards,<br/>The Operations Team</p>
    </div>
  `;

  await sendEmailAndLog({
    organizationId: customer.organizationId,
    orderId: order.id,
    orderType: 'SALES',
    to: customer.email,
    subject,
    html,
    emailType: status === 'CONFIRMED' ? 'ORDER_CONFIRMED' : 'ORDER_DECLINED'
  });

  // Notify internal admins
  await notifyAdmins(customer.organizationId, subject, html, order.id, 'SALES');
}

/**
 * Sends a transactional email to a Vendor regarding a Purchase Order
 */
export async function sendPurchaseOrderEmail(
  order: PurchaseOrder,
  vendor: Vendor,
  status: 'APPROVED' | 'DECLINED' | 'CANCELLED'
) {
  if (!vendor.email) return;

  const subject = `Purchase Order #${order.id} - ${status}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Purchase Order ${status}</h2>
      <p>Dear ${vendor.name},</p>
      <p>This is a formal notification that Purchase Order <strong>#${order.id}</strong> in the amount of <strong>$${order.amount}</strong> has been <strong>${status}</strong>.</p>
      ${status === 'APPROVED' 
        ? '<p>Please proceed with the fulfillment of this order as per our standard terms.</p>' 
        : '<p>Please cancel any pending fulfillment for this order.</p>'}
      <br />
      <p>Best regards,<br/>The Procurement Team</p>
    </div>
  `;

  await sendEmailAndLog({
    organizationId: vendor.organizationId,
    orderId: order.id,
    orderType: 'PURCHASE',
    to: vendor.email,
    subject,
    html,
    emailType: status === 'APPROVED' ? 'ORDER_CONFIRMED' : 'ORDER_DECLINED'
  });

  // Notify internal admins
  await notifyAdmins(vendor.organizationId, subject, html, order.id, 'PURCHASE');
}
