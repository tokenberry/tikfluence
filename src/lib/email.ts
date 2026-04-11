import { Resend } from "resend"
import { logger } from "@/lib/logger"

const log = logger.child({ module: "email" })

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = "Foxolog <notifications@foxolog.com>"
const BRAND_COLOR = "#d4772c"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"

function emailWrapper(title: string, body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: ${BRAND_COLOR}; margin: 0; font-size: 24px;">Foxolog</h2>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px;">${title}</h3>
        ${body}
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} Foxolog. All rights reserved.
      </p>
    </div>
  `
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    log.warn(
      { event: "email_dev_mode_skip", subject, to },
      "RESEND_API_KEY not set — skipping email"
    )
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    log.error(
      { event: "email_send_failed", subject, to, err },
      "Failed to send email"
    )
  }
}

export function sendWelcomeEmail(email: string, name: string, role: string) {
  const roleLabels: Record<string, string> = {
    CREATOR: "Creator",
    NETWORK: "Creator Network",
    BRAND: "Brand",
  }
  const html = emailWrapper(
    "Welcome to Foxolog!",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${name},</p>
    <p style="color: #374151; line-height: 1.6;">
      Your <strong>${roleLabels[role] || role}</strong> account has been created.
      You're all set to start using the platform.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/login" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Sign in to Foxolog
      </a>
    </div>
    `
  )
  void send(email, "Welcome to Foxolog!", html)
}

export function sendOrderAcceptedEmail(
  brandEmail: string,
  brandName: string,
  orderTitle: string,
  creatorName: string
) {
  const html = emailWrapper(
    "Creator accepted your order",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${brandName},</p>
    <p style="color: #374151; line-height: 1.6;">
      <strong>${creatorName}</strong> has accepted your order
      "<strong>${orderTitle}</strong>". They'll start working on it shortly.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/brand/orders" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Order
      </a>
    </div>
    `
  )
  void send(brandEmail, `Order accepted: ${orderTitle}`, html)
}

export function sendDeliverySubmittedEmail(
  brandEmail: string,
  brandName: string,
  orderTitle: string
) {
  const html = emailWrapper(
    "Delivery submitted — review needed",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${brandName},</p>
    <p style="color: #374151; line-height: 1.6;">
      A delivery has been submitted for "<strong>${orderTitle}</strong>".
      Please review it and approve or request a revision.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/brand/orders" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Review Delivery
      </a>
    </div>
    `
  )
  void send(brandEmail, `Delivery ready for review: ${orderTitle}`, html)
}

export function sendOrderApprovedEmail(
  creatorEmail: string,
  creatorName: string,
  orderTitle: string,
  payout: number
) {
  const html = emailWrapper(
    "Your delivery was approved!",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${creatorName},</p>
    <p style="color: #374151; line-height: 1.6;">
      Great news! Your delivery for "<strong>${orderTitle}</strong>" has been approved.
      A payout of <strong>$${payout.toFixed(2)}</strong> is being processed.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/creator/earnings" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Earnings
      </a>
    </div>
    `
  )
  void send(creatorEmail, `Approved: ${orderTitle}`, html)
}

export function sendOrderRejectedEmail(
  creatorEmail: string,
  creatorName: string,
  orderTitle: string,
  reason: string | undefined
) {
  const html = emailWrapper(
    "Revision requested",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${creatorName},</p>
    <p style="color: #374151; line-height: 1.6;">
      The brand has requested a revision for "<strong>${orderTitle}</strong>".
    </p>
    ${reason ? `<p style="color: #374151; line-height: 1.6; background: #fef3c7; padding: 12px; border-radius: 6px;"><strong>Feedback:</strong> ${reason}</p>` : ""}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/creator/orders" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Order
      </a>
    </div>
    `
  )
  void send(creatorEmail, `Revision requested: ${orderTitle}`, html)
}

// --- F4 completion: invitation emails (v4.0.1) --------------------------

/**
 * Sent to a creator when a brand (or their agency / AM) creates an
 * `OrderInvitation` addressed to them — either via the single-invite
 * endpoint or the batch endpoint. Links to the creator invitations inbox.
 */
export function sendInvitationSentEmail(
  creatorEmail: string,
  creatorName: string,
  orderTitle: string,
  inviterName: string,
  message: string | null
) {
  const html = emailWrapper(
    "You've been invited to a campaign",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${creatorName},</p>
    <p style="color: #374151; line-height: 1.6;">
      <strong>${inviterName}</strong> invited you to join the campaign
      "<strong>${orderTitle}</strong>". The Foxolog AI surfaced your
      profile as a strong match based on audience, category, and content
      style fit.
    </p>
    ${
      message
        ? `<p style="color: #374151; line-height: 1.6; background: #fef3c7; padding: 12px; border-radius: 6px;"><strong>Message from the brand:</strong> ${message}</p>`
        : ""
    }
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/creator/invitations" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Invitation
      </a>
    </div>
    `
  )
  void send(creatorEmail, `Invitation: ${orderTitle}`, html)
}

/**
 * Sent to the inviter (brand owner / agency / AM) when an invited creator
 * accepts the invitation. Links to the brand order detail page.
 */
export function sendInvitationAcceptedEmail(
  inviterEmail: string,
  inviterName: string,
  creatorName: string,
  orderTitle: string
) {
  const html = emailWrapper(
    "Creator accepted your invitation",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${inviterName},</p>
    <p style="color: #374151; line-height: 1.6;">
      <strong>${creatorName}</strong> accepted your invitation to
      "<strong>${orderTitle}</strong>". The assignment has been created
      and they'll start working on the order shortly.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/brand/orders" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Order
      </a>
    </div>
    `
  )
  void send(inviterEmail, `Accepted: ${orderTitle}`, html)
}

/**
 * Sent to the inviter when a `PENDING` invitation expires because the
 * creator didn't respond within the configured window (default 7 days).
 * Triggered by `/api/cron/expire-invitations`.
 */
export function sendInvitationExpiredEmail(
  inviterEmail: string,
  inviterName: string,
  creatorName: string,
  orderTitle: string,
  expiryDays: number
) {
  const html = emailWrapper(
    "Invitation expired",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${inviterName},</p>
    <p style="color: #374151; line-height: 1.6;">
      Your invitation to <strong>${creatorName}</strong> for
      "<strong>${orderTitle}</strong>" expired after ${expiryDays} days
      without a response. You can invite another creator from the AI
      match list on the order page.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/brand/orders" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Order
      </a>
    </div>
    `
  )
  void send(inviterEmail, `Expired: ${orderTitle}`, html)
}

/**
 * Sent to the inviter when an invited creator declines the invitation.
 * Links to the brand order detail page so the brand can try a different
 * match from the AI shortlist.
 */
export function sendInvitationDeclinedEmail(
  inviterEmail: string,
  inviterName: string,
  creatorName: string,
  orderTitle: string
) {
  const html = emailWrapper(
    "Invitation declined",
    `
    <p style="color: #374151; line-height: 1.6;">Hi ${inviterName},</p>
    <p style="color: #374151; line-height: 1.6;">
      <strong>${creatorName}</strong> declined your invitation to
      "<strong>${orderTitle}</strong>". You can invite another creator
      from the AI match list on the order page.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/brand/orders" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Order
      </a>
    </div>
    `
  )
  void send(inviterEmail, `Declined: ${orderTitle}`, html)
}

export function sendDisputeOpenedEmail(
  emails: string[],
  orderTitle: string
) {
  const html = emailWrapper(
    "Dispute opened",
    `
    <p style="color: #374151; line-height: 1.6;">
      A dispute has been opened for order "<strong>${orderTitle}</strong>".
      Our support team will review the case and reach out with a resolution.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}" style="display: inline-block; padding: 10px 24px; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Go to Foxolog
      </a>
    </div>
    `
  )
  for (const email of emails) {
    void send(email, `Dispute opened: ${orderTitle}`, html)
  }
}
