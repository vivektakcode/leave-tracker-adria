import './globals.css'
import { Inter } from 'next/font/google'
import { SecureAuthProvider } from '../contexts/SecureAuthContext'

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
      <body className={`${inter.className} gradient-bg`}>
        <SecureAuthProvider>
          <div className="min-h-screen relative z-10">
            {children}
          </div>
        </SecureAuthProvider>
      </body>
    </html>
  )
} 