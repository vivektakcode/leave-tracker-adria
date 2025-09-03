import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const year = searchParams.get('year')

    if (!country || !year) {
      return NextResponse.json(
        { error: 'Country and year parameters are required' },
        { status: 400 }
      )
    }

    // Fetch holiday calendar from database
    const { data: holidayCalendar, error } = await supabase
      .from('holiday_calendars')
      .select('holidays')
      .eq('country', country)
      .eq('year', parseInt(year))
      .single()

    if (error) {
      console.error('Error fetching holiday calendar:', error)
      return NextResponse.json(
        { error: 'Failed to fetch holiday calendar' },
        { status: 500 }
      )
    }

    if (!holidayCalendar) {
      return NextResponse.json({ holidays: [] })
    }

    // Parse holidays from JSON
    const holidays = holidayCalendar.holidays || []

    return NextResponse.json({ holidays })
  } catch (error) {
    console.error('Error in holidays API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
