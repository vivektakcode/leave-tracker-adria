'use client'

import { useState, useEffect } from 'react'
import { getHolidaysForPeriod, Holiday } from '../lib/supabaseService'

interface HolidayAwareDatePickerProps {
  startDate: string
  endDate: string
  country: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  disabled?: boolean
}

export default function HolidayAwareDatePicker({
  startDate,
  endDate,
  country,
  onStartDateChange,
  onEndDateChange,
  disabled = false
}: HolidayAwareDatePickerProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (country && startDate && endDate) {
      loadHolidays()
    }
  }, [country, startDate, endDate])

  const loadHolidays = async () => {
    if (!country || !startDate || !endDate) return
    
    setLoading(true)
    try {
      const holidayData = await getHolidaysForPeriod(country, startDate, endDate)
      setHolidays(holidayData)
    } catch (error) {
      console.error('Error loading holidays:', error)
    } finally {
      setLoading(false)
    }
  }

  const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return holidays.some(holiday => holiday.date === dateStr)
  }

  const getHolidayName = (date: Date): string | null => {
    const dateStr = date.toISOString().split('T')[0]
    const holiday = holidays.find(h => h.date === dateStr)
    return holiday ? holiday.name : null
  }

  const isInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false
    const current = date.getTime()
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    return current >= start && current <= end
  }

  const isStartDate = (date: Date): boolean => {
    return startDate && date.toISOString().split('T')[0] === startDate
  }

  const isEndDate = (date: Date): boolean => {
    return endDate && date.toISOString().split('T')[0] === endDate
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
    for (let day = 1; day <= 6 - lastDayOfWeek; day++) {
      days.push(new Date(year, month + 1, day))
    }
    
    return days
  }

  const handleDateClick = (date: Date) => {
    if (disabled) return
    
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) return // Can't select past dates
    
    if (!startDate || (startDate && endDate)) {
      // Starting new selection
      onStartDateChange(dateStr)
      onEndDateChange('')
    } else {
      // Completing selection
      if (dateStr < startDate) {
        onStartDateChange(dateStr)
        onEndDateChange(startDate)
      } else {
        onEndDateChange(dateStr)
      }
    }
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
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={nextMonth}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
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
          const isToday = date.toDateString() === new Date().toDateString()
          const isHolidayDate = isHoliday(date)
          const isInDateRange = isInRange(date)
          const isStart = isStartDate(date)
          const isEnd = isEndDate(date)
          const holidayName = getHolidayName(date)
          
          let bgColor = 'bg-white hover:bg-gray-50'
          let textColor = 'text-gray-900'
          let borderColor = 'border-gray-200'
          
          if (!isCurrentMonth) {
            bgColor = 'bg-gray-50'
            textColor = 'text-gray-400'
          } else if (isHolidayDate) {
            bgColor = 'bg-red-100 hover:bg-red-200'
            textColor = 'text-red-800'
            borderColor = 'border-red-300'
          } else if (isStart || isEnd) {
            bgColor = 'bg-orange-500 hover:bg-orange-600'
            textColor = 'text-white'
            borderColor = 'border-orange-500'
          } else if (isInDateRange) {
            bgColor = 'bg-orange-100 hover:bg-orange-200'
            textColor = 'text-orange-800'
            borderColor = 'border-orange-200'
          } else if (isToday) {
            bgColor = 'bg-blue-100 hover:bg-blue-200'
            textColor = 'text-blue-800'
            borderColor = 'border-blue-300'
          }
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                relative p-2 text-center text-sm font-medium rounded-lg cursor-pointer
                transition-colors duration-200 border-2 ${borderColor}
                ${bgColor} ${textColor}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md'}
                ${!isCurrentMonth ? 'cursor-not-allowed' : ''}
              `}
              title={holidayName ? `Holiday: ${holidayName}` : undefined}
            >
              {date.getDate()}
              {isHolidayDate && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Selected dates</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-100 rounded"></div>
          <span>Date range</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span>Holidays</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span>Today</span>
        </div>
      </div>

      {/* Holiday Info */}
      {holidays.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Holidays in selected period:</h4>
          <div className="space-y-1">
            {holidays.map((holiday, index) => (
              <div key={index} className="text-sm text-red-700">
                <span className="font-medium">{holiday.date}:</span> {holiday.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Loading holidays...
        </div>
      )}
    </div>
  )
}
