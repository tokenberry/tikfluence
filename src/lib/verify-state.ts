import crypto from "crypto"

interface VerifyStatePayload {
  creatorId: string
  userId: string
  tiktokUsername: string
  exp: number
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error("No auth secret configured")
  return secret
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

export function createVerifyState(
  creatorId: string,
  userId: string,
  tiktokUsername: string
): string {
  const secret = getSecret()
  const payload: VerifyStatePayload = {
    creatorId,
    userId,
    tiktokUsername,
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = sign(data, secret)
  return `${data}.${signature}`
}

export function verifyState(state: string): VerifyStatePayload | null {
  try {
    const secret = getSecret()
    const [data, signature] = state.split(".")
    if (!data || !signature) return null

    const expectedSig = sign(data, secret)
    if (signature !== expectedSig) return null

    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as VerifyStatePayload

    if (Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}
