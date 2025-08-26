'use client'

interface LeaveBalanceProps {
  balances: {
    casual: number
    sick: number
    privilege: number
  }
}

export default function LeaveBalance({ balances }: LeaveBalanceProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{balances.casual}</div>
          <div className="text-sm text-gray-600">Casual Leave</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-600">{balances.sick}</div>
          <div className="text-sm text-gray-600">Sick Leave</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">{balances.privilege}</div>
          <div className="text-sm text-gray-600">Privilege Leave</div>
        </div>
      </div>
    </div>
  )
} 