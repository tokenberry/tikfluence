export default function FoxLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/fox-logo.png" alt="Foxolog" className={className} />
  )
}
