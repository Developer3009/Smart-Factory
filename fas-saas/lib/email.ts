import { Resend } from 'resend';
import { Customer, Vendor, SalesOrder, PurchaseOrder } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'orders@antigravity-erp.com';

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

  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customer.email,
        subject,
        html,
      });
    } else {
      console.log('Mock Email (Customer):', { subject, to: customer.email });
    }
  } catch (error) {
    console.error('Failed to send sales order email:', error);
  }
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

  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: vendor.email,
        subject,
        html,
      });
    } else {
      console.log('Mock Email (Vendor):', { subject, to: vendor.email });
    }
  } catch (error) {
    console.error('Failed to send purchase order email:', error);
  }
}
