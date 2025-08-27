'use client'

import { useAuth } from '../../../contexts/JsonAuthContext'
import UserManagement from '../../../components/UserManagement'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminUsersPage() {
  const { currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (currentUser && currentUser.role !== 'manager') {
      router.push('/')
    }
  }, [currentUser, router])

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (currentUser.role !== 'manager') {
    return null
  }

  return <UserManagement currentUser={currentUser} />
} 