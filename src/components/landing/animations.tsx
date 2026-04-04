"use client"

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"
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
