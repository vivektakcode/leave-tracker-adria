import { NextRequest, NextResponse } from 'next/server'
import { 
  createLeaveRequest, 
  getAllLeaveRequests, 
  processLeaveRequest 
} from '../../../lib/vercelKVService'

export async function GET() {
  try {
    const leaveRequests = await getAllLeaveRequests()
    return NextResponse.json({ leaveRequests })
  } catch (error) {
    console.error('Error reading leave requests:', error)
    return NextResponse.json({ error: 'Failed to read leave requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, employeeName, leaveType, startDate, endDate, reason } = body

    // Validate required fields
    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create leave request via Vercel KV service
    const requestId = await createLeaveRequest({
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason
    })

    console.log('✅ Leave request created via KV:', requestId)
    return NextResponse.json({ id: requestId }, { status: 201 })

  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, status, adminUsername, comments } = body

    // Validate required fields
    if (!requestId || !status || !adminUsername) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process leave request via Vercel KV service
    const success = await processLeaveRequest(requestId, status, adminUsername, comments)

    if (success) {
      console.log('✅ Leave request processed via KV:', requestId, status)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to process leave request' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating leave request:', error)
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    )
  }
} 