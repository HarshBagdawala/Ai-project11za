import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Visual Search Bot - Product Discovery',
  description: 'AI-powered product visual search for WhatsApp'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
