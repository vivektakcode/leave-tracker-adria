/**
 * Date utility functions for leave management system
 * Handles weekend detection, business day calculations, and future holiday support
 */

export interface Holiday {
  date: string // YYYY-MM-DD format
  name: string
  description?: string
}

// TODO: Future enhancement - load holidays from database or API
const HOLIDAYS: Holiday[] = [
  // Example holidays - replace with actual holiday data
  // { date: '2024-01-01', name: 'New Year\'s Day' },
  // { date: '2024-12-25', name: 'Christmas Day' },
]

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if the date is a weekend
 */
export const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString)
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a holiday
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if the date is a holiday
 */
export const isHoliday = (dateString: string): boolean => {
  return HOLIDAYS.some(holiday => holiday.date === dateString)
}

/**
 * Check if a date is disabled for leave requests
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if the date should be disabled
 */
export const isDateDisabled = (dateString: string): boolean => {
  // Disable weekends
  if (isWeekend(dateString)) {
    return true
  }
  
  // Disable holidays
  if (isHoliday(dateString)) {
    return true
  }
  
  return false
}

/**
 * Get the next business day from a given date
 * @param fromDate - Starting date
 * @returns Next business day (not weekend, not holiday)
 */
export const getNextBusinessDay = (fromDate: Date): Date => {
  let nextDay = new Date(fromDate)
  nextDay.setDate(nextDay.getDate() + 1)
  
  while (isDateDisabled(nextDay.toISOString().split('T')[0])) {
    nextDay.setDate(nextDay.getDate() + 1)
  }
  
  return nextDay
}

/**
 * Get the previous business day from a given date
 * @param fromDate - Starting date
 * @returns Previous business day (not weekend, not holiday)
 */
export const getPreviousBusinessDay = (fromDate: Date): Date => {
  let prevDay = new Date(fromDate)
  prevDay.setDate(prevDay.getDate() - 1)
  
  while (isDateDisabled(prevDay.toISOString().split('T')[0])) {
    prevDay.setDate(prevDay.getDate() - 1)
  }
  
  return prevDay
}

/**
 * Calculate the number of business days between two dates
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Number of business days (excluding weekends and holidays)
 */
export const getBusinessDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start > end) return 0
  
  let businessDays = 0
  let current = new Date(start)
  
  while (current <= end) {
    if (!isDateDisabled(current.toISOString().split('T')[0])) {
      businessDays++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return businessDays
}

/**
 * Get the minimum end date for leave requests (must be after start date and not disabled)
 * @param startDate - Start date in YYYY-MM-DD format
 * @returns Minimum valid end date
 */
export const getMinEndDate = (startDate: string): string => {
  if (!startDate) return ''
  
  let minDate = new Date(startDate)
  minDate.setDate(minDate.getDate() + 1) // Start from next day after start date
  
  // Find the next available business day
  while (isDateDisabled(minDate.toISOString().split('T')[0])) {
    minDate.setDate(minDate.getDate() + 1)
  }
  
  return minDate.toISOString().split('T')[0]
}

/**
 * Add holidays to the system
 * @param holidays - Array of holiday objects
 */
export const addHolidays = (holidays: Holiday[]): void => {
  HOLIDAYS.push(...holidays)
}

/**
 * Remove holidays from the system
 * @param dateStrings - Array of dates to remove
 */
export const removeHolidays = (dateStrings: string[]): void => {
  const datesToRemove = new Set(dateStrings)
  const index = HOLIDAYS.findIndex(holiday => datesToRemove.has(holiday.date))
  if (index > -1) {
    HOLIDAYS.splice(index, 1)
  }
}

/**
 * Get all holidays
 * @returns Array of all holidays
 */
export const getAllHolidays = (): Holiday[] => {
  return [...HOLIDAYS]
}
