import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Foxolog — TikTok Influencer Marketplace"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Orange glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,119,44,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "linear-gradient(135deg, #d4772c, #e8943d)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 0 60px rgba(212,119,44,0.4)",
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 900, color: "white" }}>F</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "white",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Fox
          <span style={{ color: "#d4772c" }}>olog</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "#9ca3af",
            margin: "16px 0 0 0",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          The TikTok Influencer Marketplace for Brands & Creators
        </p>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            gap: 24,
            alignItems: "center",
            color: "#6b7280",
            fontSize: 16,
          }}
        >
          <span>www.foxolog.com</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#374151" }} />
          <span>AI-Powered</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#374151" }} />
          <span>Secure Escrow</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#374151" }} />
          <span>Global Payouts</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
