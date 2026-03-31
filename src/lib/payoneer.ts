/**
 * Payoneer Mass Payout API client
 *
 * Handles creator/network payouts via Payoneer.
 * Gracefully skips when API keys are not configured (dev mode).
 *
 * Required env vars:
 *   PAYONEER_PARTNER_ID  — Your Payoneer partner/program ID
 *   PAYONEER_API_KEY     — API key (or username:password for basic auth)
 *   PAYONEER_API_URL     — API base URL (sandbox or production)
 */

const PAYONEER_PARTNER_ID = process.env.PAYONEER_PARTNER_ID
const PAYONEER_API_KEY = process.env.PAYONEER_API_KEY
const PAYONEER_API_URL =
  process.env.PAYONEER_API_URL || "https://api.payoneer.com/v4/programs"

function isConfigured(): boolean {
  return !!(PAYONEER_PARTNER_ID && PAYONEER_API_KEY)
}

async function payoneerFetch(path: string, options: RequestInit = {}) {
  if (!isConfigured()) {
    console.warn("[payoneer] Not configured — skipping API call:", path)
    return null
  }

  const url = `${PAYONEER_API_URL}/${PAYONEER_PARTNER_ID}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(PAYONEER_API_KEY!).toString("base64")}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[payoneer] API error ${res.status}:`, text)
    throw new Error(`Payoneer API error: ${res.status}`)
  }

  return res.json()
}

/**
 * Register a payee (creator/network) with Payoneer.
 * Returns a registration link the user must complete.
 */
export async function registerPayee(params: {
  payeeId: string
  email: string
  firstName: string
  lastName: string
  redirectUrl: string
}): Promise<{ registrationUrl: string | null; devMode: boolean }> {
  if (!isConfigured()) {
    console.warn("[payoneer] Dev mode — skipping payee registration for:", params.email)
    return { registrationUrl: null, devMode: true }
  }

  const data = await payoneerFetch("/payees/registration-link", {
    method: "POST",
    body: JSON.stringify({
      payee_id: params.payeeId,
      registration_information: {
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
      },
      redirect_url: params.redirectUrl,
    }),
  })

  return {
    registrationUrl: data?.registration_link || null,
    devMode: false,
  }
}

/**
 * Get payee status from Payoneer
 */
export async function getPayeeStatus(
  payeeId: string
): Promise<{ status: string; devMode: boolean }> {
  if (!isConfigured()) {
    return { status: "DEV_MODE", devMode: true }
  }

  const data = await payoneerFetch(`/payees/${payeeId}/status`)
  return {
    status: data?.status || "UNKNOWN",
    devMode: false,
  }
}

/**
 * Create a payout to a registered payee.
 * Returns the payout ID or null if in dev mode.
 */
export async function createPayout(params: {
  payeeId: string
  amount: number
  currency?: string
  description: string
  paymentId: string // our internal reference (e.g. transaction ID)
}): Promise<{ payoutId: string | null; devMode: boolean }> {
  if (!isConfigured()) {
    console.warn(
      `[payoneer] Dev mode — skipping payout of $${params.amount} to payee ${params.payeeId}`
    )
    return { payoutId: null, devMode: true }
  }

  const data = await payoneerFetch("/payouts", {
    method: "POST",
    body: JSON.stringify({
      payee_id: params.payeeId,
      amount: params.amount,
      currency: params.currency || "USD",
      description: params.description,
      client_reference_id: params.paymentId,
    }),
  })

  return {
    payoutId: data?.payout_id || null,
    devMode: false,
  }
}
