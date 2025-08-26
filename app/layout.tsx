import './globals.css'
import { Inter } from 'next/font/google'
import { JsonAuthProvider } from '../contexts/JsonAuthContext'

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
        <JsonAuthProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </JsonAuthProvider>
      </body>
    </html>
  )
} 