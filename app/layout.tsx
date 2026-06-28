import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Formix',
  description: 'A browser-based form builder — design, fill, and export forms.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
