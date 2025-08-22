import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import speakAppLogoPng from '@/app/assets/speak app logo.png'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: 'Musubime',
      template: '%s - Musubime'
    },
    description: 'インフルエンサー施策をスムーズにつなぐ、運用・承認・進行管理のためのワークフロー管理ツール',
    applicationName: 'Musubime',
    metadataBase: new URL('https://musubime.app'),
    openGraph: {
      title: 'Musubime',
      description: 'インフルエンサー施策をスムーズにつなぐ、運用・承認・進行管理のためのワークフロー管理ツール',
      siteName: 'Musubime',
      type: 'website',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Musubime',
      description: 'インフルエンサー施策をスムーズにつなぐ、運用・承認・進行管理のためのワークフロー管理ツール',
    },
    icons: {
      icon: speakAppLogoPng.src,
      shortcut: speakAppLogoPng.src,
      apple: speakAppLogoPng.src,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
