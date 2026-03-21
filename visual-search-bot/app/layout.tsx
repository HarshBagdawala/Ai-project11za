import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Visual Search Bot - Product Discovery',
  description: 'AI-powered product visual search for WhatsApp',
  charset: 'UTF-8',
  viewport: 'width=device-width, initial-scale=1'
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
