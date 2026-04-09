"use client"

import { motion, useInView, useMotionValue, useTransform, useSpring, animate } from "framer-motion"
import { useRef, useEffect, type ReactNode, type MouseEvent } from "react"

/* ------------------------------------------------------------------ */
/*  FadeIn – fades + slides up when element scrolls into view         */
/* ------------------------------------------------------------------ */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  StaggerChildren – staggers entrance of direct children            */
/* ------------------------------------------------------------------ */
export function StaggerChildren({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  },
}

/* ------------------------------------------------------------------ */
/*  CountUp – animates a number from 0 to `to`                       */
/* ------------------------------------------------------------------ */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  className = "",
}: {
  to: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    if (!inView) return
    const controls = animate(count, to, { duration: 1.8, ease: "easeOut" })
    return controls.stop
  }, [inView, count, to])

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  useMouseParallax – subtle depth effect on hero elements           */
/* ------------------------------------------------------------------ */
export function useMouseParallax(strength: number = 15) {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springConfig = { stiffness: 50, damping: 20 }
  const x = useSpring(rawX, springConfig)
  const y = useSpring(rawY, springConfig)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) return

    // Skip on touch-only devices
    if (window.matchMedia("(hover: none)").matches) return

    function handleMouseMove(e: globalThis.MouseEvent) {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      rawX.set(((e.clientX - centerX) / centerX) * strength)
      rawY.set(((e.clientY - centerY) / centerY) * strength)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [strength, rawX, rawY])

  return { x, y }
}

/* ------------------------------------------------------------------ */
/*  AuroraOrbs – floating blurred orbs for organic background         */
/* ------------------------------------------------------------------ */
export function AuroraOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary orange orb — large, slow drift */}
      <div className="aurora-orb aurora-orb-1" />
      {/* Secondary warm orb — medium, offset drift */}
      <div className="aurora-orb aurora-orb-2" />
      {/* Accent orb — small, faster */}
      <div className="aurora-orb aurora-orb-3" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  LetterReveal – letter-by-letter stagger with spring animation     */
/* ------------------------------------------------------------------ */
export function LetterReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.03,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      aria-label={text}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 40, rotateX: -90 },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              transition: {
                type: "spring",
                stiffness: 150,
                damping: 12,
              },
            },
          }}
          style={{ display: char === " " ? "inline" : "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightCursor – radial light that follows cursor over the hero  */
/* ------------------------------------------------------------------ */
export function SpotlightCursor() {
  const spotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) return
    if (window.matchMedia("(hover: none)").matches) return

    function handleMouseMove(e: globalThis.MouseEvent) {
      if (!spotRef.current) return
      spotRef.current.style.setProperty("--spot-x", `${e.clientX}px`)
      spotRef.current.style.setProperty("--spot-y", `${e.clientY}px`)
      spotRef.current.style.opacity = "1"
    }

    function handleMouseLeave() {
      if (!spotRef.current) return
      spotRef.current.style.opacity = "0"
    }

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={spotRef}
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300"
      style={{
        background: `radial-gradient(600px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(212,119,44,0.06), transparent 60%)`,
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  MagneticButton – button that pulls toward cursor on hover         */
/* ------------------------------------------------------------------ */
export function MagneticButton({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 15 })
  const springY = useSpring(y, { stiffness: 200, damping: 15 })

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    if (window.matchMedia("(hover: none)").matches) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.3)
    y.set((e.clientY - centerY) * 0.3)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  GlowCard – card with orange glow that follows cursor on hover     */
/* ------------------------------------------------------------------ */
export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty("--glow-x", `${x}px`)
    card.style.setProperty("--glow-y", `${y}px`)
  }

  return (
    <motion.div
      variants={staggerItem}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`glow-card ${className}`}
    >
      {children}
    </motion.div>
  )
}
