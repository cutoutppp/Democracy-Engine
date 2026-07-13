import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Democracy Engine',
  description: 'Game Engine for Thai Politics Card Game',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <div className="bg-abstract"></div>
        {children}
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 9999, fontFamily: 'monospace' }}>
          v1.2.0
        </div>
      </body>
    </html>
  )
}
