import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/JsonAuthContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata = {
  title: 'Leave Tracker - Employee Management System',
  description: 'Professional employee leave management system with modern design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical assets for faster loading */}
        <link rel="preload" href="/Adria_logo.svg" as="image" type="image/svg+xml" />
        <link rel="preconnect" href="https://guklrhwoqbzffbglizlt.supabase.co" />
      </head>
      <body className={`${inter.className} gradient-bg`}>
        <AuthProvider>
          <div className="min-h-screen relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 