'use client'

import { useState } from 'react'

interface WeekendAwareDatePickerProps {
  value: string
  onChange: (date: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function WeekendAwareDatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select date"
}: WeekendAwareDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday = 0, Saturday = 6
  }

  const isToday = (date: Date): boolean => {
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date: Date): boolean => {
    return Boolean(value && date.toISOString().split('T')[0] === value)
  }

  const getDaysInMonth = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []
    
    // Add previous month's days to fill first week
    const firstDayOfWeek = firstDay.getDay()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    // Add next month's days to fill last week
    const lastDayOfWeek = lastDay.getDay()
    for (day = 1; day <= 6 - lastDayOfWeek; day++) {
      days.push(new Date(year, month + 1, day))
    }
    
    return days
  }

  const handleDateClick = (date: Date) => {
    if (disabled || isWeekend(date)) return
    
    const dateStr = date.toISOString().split('T')[0]
    onChange(dateStr)
    setIsOpen(false)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        readOnly
        placeholder={placeholder}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
        disabled={disabled}
      />
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
              const isWeekendDate = isWeekend(date)
              const isTodayDate = isToday(date)
              const isSelectedDate = isSelected(date)
              
              let bgColor = 'bg-white hover:bg-gray-50'
              let textColor = 'text-gray-900'
              let cursorClass = 'cursor-pointer'
              
              if (!isCurrentMonth) {
                bgColor = 'bg-gray-50'
                textColor = 'text-gray-400'
                cursorClass = 'cursor-not-allowed'
              } else if (isWeekendDate) {
                bgColor = 'bg-gray-100'
                textColor = 'text-gray-400'
                cursorClass = 'cursor-not-allowed'
              } else if (isSelectedDate) {
                bgColor = 'bg-orange-500 hover:bg-orange-600'
                textColor = 'text-white'
              } else if (isTodayDate) {
                bgColor = 'bg-blue-100 hover:bg-blue-200'
                textColor = 'text-blue-800'
              }
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    relative p-2 text-center text-sm font-medium rounded-lg
                    transition-colors duration-200 border-2 border-transparent
                    ${bgColor} ${textColor} ${cursorClass}
                    ${isWeekendDate ? 'opacity-50' : 'hover:shadow-md'}
                  `}
                >
                  {date.getDate()}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Selected date</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Weekends (disabled)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
