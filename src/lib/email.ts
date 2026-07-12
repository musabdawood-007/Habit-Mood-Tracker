/**
 * Email utility — uses nodemailer with a configurable SMTP transport.
 *
 * Provider-agnostic: swapping Gmail → Resend/SendGrid/Brevo is just an env
 * var change. The transporter is created lazily and cached.
 *
 * In development with no SMTP env vars set, we fall back to a JSON transport
 * that logs the email body to the console — useful for local testing without
 * a real email account.
 */

import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[email] SMTP env vars not set — falling back to JSON transport (emails will be logged to console only)."
    );
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/2525
    auth: { user, pass },
  });
  return transporter;
}

export interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailParams) {
  const t = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "Habit & Mood Tracker";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";

  const info = await t.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html: html || text,
  });

  // Log in dev (JSON transport doesn't actually send)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email] sent to ${to}: ${subject} (id=${info.messageId})`);
  }

  return info;
}
