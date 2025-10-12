import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Ko\'chmas Mulk Bahosi - O\'zbekiston Real Estate Analysis',
  description: 'O\'zbekiston ko\'chmas mulki uchun aqlli tahlil. AI yordamida mulk bitimlarini tezkor baholash va tavsiyalar oling.',
  keywords: 'ko\'chmas mulk, uzbekistan, real estate, AI, tahlil, baholash',
  authors: [{ name: 'Bexruz' }],
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  )
}

