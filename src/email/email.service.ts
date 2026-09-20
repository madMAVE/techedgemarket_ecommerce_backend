import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { Order, OrderItem } from "@prisma/client";
import { AppConfig } from "../common/config/app.config";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: AppConfig) {
    this.transporter = nodemailer.createTransport({
      host: this.config.email.host,
      port: this.config.email.port,
      secure: this.config.email.secure,
      auth: {
        user: this.config.email.user,
        pass: this.config.email.pass,
      },
    });
  }

  async sendOrderNotification(order: Order & { items: OrderItem[] }) {
    const orgAddress = order.orgAddress as any;
    const shipAddress = order.shippingAddress as any;

    const itemsTable = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">${item.productName}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${item.totalPrice.toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; color: #1e293b;">
        <div style="background: #1e40af; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">TechEdge Market</h1>
          <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 13px;">New Order Received</p>
        </div>

        <div style="padding: 24px;">
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px;"><strong>Order No:</strong> ${order.orderNumber}</p>
            <p style="margin: 4px 0 0; font-size: 14px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString("en-IN")}</p>
            <p style="margin: 4px 0 0; font-size: 14px;"><strong>Status:</strong> <span style="background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">PENDING</span></p>
          </div>

          <h2 style="font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Customer Details</h2>
          <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
            <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Name</td><td style="padding: 4px 0; font-weight: 500;">${order.customerName}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Email</td><td style="padding: 4px 0;">${order.customerEmail}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Mobile</td><td style="padding: 4px 0;">+91 ${order.mobile}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Company</td><td style="padding: 4px 0; font-weight: 500;">${order.customerCompany}</td></tr>
          </table>

          <h2 style="font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Addresses</h2>
          <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <p style="font-weight: 600; font-size: 13px; color: #64748b; margin: 0 0 4px;">Organization Address</p>
              <p style="font-size: 14px; margin: 0;">${orgAddress.street}, ${orgAddress.city}, ${orgAddress.state} - ${orgAddress.zip}</p>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <p style="font-weight: 600; font-size: 13px; color: #64748b; margin: 0 0 4px;">Delivery Address</p>
              <p style="font-size: 14px; margin: 0;">${shipAddress.street}, ${shipAddress.city}, ${shipAddress.state} - ${shipAddress.zip}</p>
            </div>
          </div>

          ${order.locationUrl ? `<p style="font-size: 14px; margin-bottom: 20px;"><strong>Location Pin:</strong> <a href="${order.locationUrl}" style="color: #1e40af;">${order.locationUrl}</a></p>` : ""}

          <h2 style="font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Product</th>
                <th style="padding: 8px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Qty</th>
                <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Unit Price</th>
                <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsTable}</tbody>
          </table>

          <div style="text-align: right; margin-bottom: 20px; font-size: 14px;">
            <p style="margin: 4px 0;">Subtotal: <strong>₹${order.subtotal.toFixed(2)}</strong></p>
            <p style="margin: 4px 0;">GST (18%): <strong>₹${order.taxAmount.toFixed(2)}</strong></p>
            <p style="margin: 4px 0;">Shipping: <strong>${order.shippingAmount === 0 ? "FREE" : "₹" + order.shippingAmount.toFixed(2)}</strong></p>
            <p style="margin: 12px 0 0; font-size: 18px; color: #1e40af;">Grand Total: <strong>₹${order.totalAmount.toFixed(2)}</strong></p>
          </div>

          <p style="font-size: 14px; color: #64748b;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          ${order.poReference ? `<p style="font-size: 14px; color: #64748b;"><strong>PO Reference:</strong> ${order.poReference}</p>` : ""}
          ${order.notes ? `<div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin-top: 16px;"><p style="margin: 0; font-size: 14px;"><strong>Customer Note:</strong> ${order.notes}</p></div>` : ""}
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">This is an automated notification from TechEdge Market</p>
          <p style="margin: 4px 0 0;">Order placed via web portal</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"TechEdge Market Orders" <${this.config.email.user}>`,
        to: order.customerEmail,
        cc: this.config.email.toAddress,
        subject: `Order Confirmed: ${order.orderNumber} — ₹${order.totalAmount.toFixed(2)}`,
        html,
      });
      this.logger.log(`Order notification sent for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error(`Failed to send order notification for ${order.orderNumber}`, err);
    }
  }
}
