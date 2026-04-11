import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { put } from "@vercel/blob"
import { randomUUID } from "crypto"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB — note: Vercel Hobby
                                         // serverless bodies are capped at
                                         // 4.5MB; video drafts of any real
                                         // length need a Pro plan or the
                                         // client-direct upload flow
                                         // (deferred follow-up).

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
]

// Magic byte signatures for server-side file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [], // checked separately: RIFF....WEBP
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    // RIFF at offset 0 and WEBP at offset 8
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    )
  }
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    // ISO BMFF container: bytes 4..8 = "ftyp"
    return (
      buffer.length >= 12 &&
      buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
    )
  }
  if (mimeType === "video/webm") {
    // EBML header: 1A 45 DF A3
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3
    )
  }
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures || signatures.length === 0) return true
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rl = rateLimit(`upload:${session.user.id}`, RATE_LIMITS.upload)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    // Optional hint from the client to allow video uploads. When absent,
    // only images are accepted (matches pre-v3.19 behaviour).
    const kindField = formData.get("kind")
    const kind =
      typeof kindField === "string" && kindField === "video"
        ? "video"
        : "image"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes =
      kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    const maxSize = kind === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    const maxLabel = kind === "video" ? "100MB" : "10MB"

    if (!allowedTypes.includes(file.type)) {
      const label =
        kind === "video"
          ? "Invalid file type. Allowed: MP4, MOV, WebM"
          : "Invalid file type. Allowed: JPEG, PNG, WebP, GIF"
      return NextResponse.json({ error: label }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxLabel}` },
        { status: 400 }
      )
    }

    // Validate file content matches claimed MIME type via magic bytes
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      )
    }

    // Derive extension from validated MIME type, not from user-supplied filename
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
    }
    const ext = MIME_TO_EXT[file.type] || "bin"
    const filename = `uploads/${randomUUID()}.${ext}`

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url, filename: blob.pathname }, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
