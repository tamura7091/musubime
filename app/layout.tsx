import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import speakAppLogoPng from '@/app/assets/speak app logo.png'

export const metadata: Metadata = {
  title: 'Speak Influencer Management',
  description: 'Manage influencer campaigns with ease',
  icons: {
    icon: speakAppLogoPng.src,
    shortcut: speakAppLogoPng.src,
    apple: speakAppLogoPng.src,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
