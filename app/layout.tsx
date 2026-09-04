import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mulk Tahlilchi — Uzbekiston ko\'chmas mulk narx tahlili',
  description:
    "O'zbekiston ko'chmas mulk bozori uchun mustaqil narx tahlili. Mulkning adolatli bahosini hisoblang, so'ralayotgan narx bilan solishtiring va muzokara uchun aniq raqam oling.",
  keywords: ["ko'chmas mulk", 'kvartira narxi', 'Toshkent', 'baholash', 'недвижимость Узбекистан', 'оценка квартиры'],
  authors: [{ name: 'Bexruz Tursunboev' }],
}

/**
 * Next 14 wants viewport in its own export. It was previously inside `metadata`,
 * which Next ignored with a build warning — and it carried `maximum-scale=1` and
 * `user-scalable=no`, which stops people from pinch-zooming. On a page of dense
 * financial figures that is a real accessibility failure, so zoom is allowed.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint. Without this the page
          renders light and then flips, which is the flash every theme toggle
          implementation has to solve somewhere.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
