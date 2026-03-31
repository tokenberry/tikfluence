import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      )
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    const ext = file.name.split(".").pop() || "png"
    const filename = `${randomUUID()}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate file content matches claimed MIME type via magic bytes
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      )
    }

    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename }, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
