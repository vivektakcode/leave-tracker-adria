/**
 * Date utility functions for leave management system
 * Handles weekend detection, business day calculations, and holiday support
 */

export interface Holiday {
  date: string // YYYY-MM-DD format
  name: string
  description?: string
}

// Cache for holidays to avoid repeated API calls
let holidaysCache: Holiday[] = []
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch holidays from database for a specific country and year
 * @param country - Country code
 * @param year - Year to fetch holidays for
 * @returns Promise<Holiday[]> - Array of holidays
 */
export const fetchHolidaysFromDB = async (country: string, year: number): Promise<Holiday[]> => {
  try {
    const response = await fetch(`/api/holidays?country=${country}&year=${year}`)
    if (!response.ok) {
      console.warn('Failed to fetch holidays from database')
      return []
    }
    const data = await response.json()
    return data.holidays || []
  } catch (error) {
    console.warn('Error fetching holidays:', error)
    return []
  }
}

/**
 * Get holidays for current user's country and year
 * @param country - User's country
 * @param year - Year to get holidays for
 * @returns Promise<Holiday[]> - Array of holidays
 */
export const getHolidays = async (country: string, year: number): Promise<Holiday[]> => {
  const now = Date.now()
  
  // Check if cache is still valid
  if (holidaysCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return holidaysCache
  }
  
  // Fetch fresh data
  const holidays = await fetchHolidaysFromDB(country, year)
  holidaysCache = holidays
  cacheTimestamp = now
  
  return holidays
}

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
 * @param country - User's country (optional, for async holiday checking)
 * @param year - Year to check (optional, for async holiday checking)
 * @returns true if the date is a holiday
 */
export const isHoliday = (dateString: string, country?: string, year?: number): boolean => {
  // For synchronous calls, check cache first
  if (holidaysCache.length > 0) {
    return holidaysCache.some(holiday => holiday.date === dateString)
  }
  
  // If no cache and no country/year provided, return false
  return false
}

/**
 * Check if a date is a holiday (async version)
 * @param dateString - Date in YYYY-MM-DD format
 * @param country - User's country
 * @param year - Year to check
 * @returns Promise<boolean> - true if the date is a holiday
 */
export const isHolidayAsync = async (dateString: string, country: string, year: number): Promise<boolean> => {
  const holidays = await getHolidays(country, year)
  return holidays.some(holiday => holiday.date === dateString)
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
 * Add holidays to the cache
 * @param holidays - Array of holiday objects
 */
export const addHolidays = (holidays: Holiday[]): void => {
  holidaysCache.push(...holidays)
}

/**
 * Remove holidays from the cache
 * @param dateStrings - Array of dates to remove
 */
export const removeHolidays = (dateStrings: string[]): void => {
  const datesToRemove = new Set(dateStrings)
  const index = holidaysCache.findIndex(holiday => datesToRemove.has(holiday.date))
  if (index > -1) {
    holidaysCache.splice(index, 1)
  }
}

/**
 * Get all holidays from cache
 * @returns Array of all holidays
 */
export const getAllHolidays = (): Holiday[] => {
  return [...holidaysCache]
}
