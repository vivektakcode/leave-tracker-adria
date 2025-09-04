// Email queue system for handling high volume
import { sendLeaveRequestEmail, sendLeaveReminderEmail, sendPasswordResetEmail, sendManagerChangeNotification } from './emailService'

interface EmailJob {
  id: string
  type: 'leave_request' | 'leave_reminder' | 'password_reset' | 'manager_change'
  data: any
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledFor?: Date
}

class EmailQueue {
  private queue: EmailJob[] = []
  private processing = false
  private maxConcurrent = 5
  private currentProcessing = 0

  // Add email to queue
  async addEmail(type: EmailJob['type'], data: any, delay?: number): Promise<string> {
    const job: EmailJob = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      scheduledFor: delay ? new Date(Date.now() + delay) : undefined
    }

    this.queue.push(job)
    console.log(`📧 Email queued: ${type} (ID: ${job.id})`)
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }

    return job.id
  }

  // Process email queue
  private async processQueue(): Promise<void> {
    if (this.processing) return
    
    this.processing = true
    console.log('📧 Starting email queue processing...')

    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const job = this.queue.shift()
      if (!job) break

      // Check if job is scheduled for later
      if (job.scheduledFor && job.scheduledFor > new Date()) {
        this.queue.push(job) // Put it back
        continue
      }

      this.currentProcessing++
      this.processJob(job)
    }

    this.processing = false
  }

  // Process individual email job
  private async processJob(job: EmailJob): Promise<void> {
    try {
      console.log(`📧 Processing email: ${job.type} (ID: ${job.id}, Attempt: ${job.attempts + 1})`)
      
      let success = false

      switch (job.type) {
        case 'leave_request':
          success = await sendLeaveRequestEmail(
            job.data.managerEmail,
            job.data.managerName,
            job.data.employeeName,
            job.data.startDate,
            job.data.endDate,
            job.data.leaveType
          )
          break

        case 'leave_reminder':
          success = await sendLeaveReminderEmail(
            job.data.managerEmail,
            job.data.managerName,
            job.data.employeeName,
            job.data.startDate,
            job.data.endDate,
            job.data.daysPending
          )
          break

        case 'password_reset':
          success = await sendPasswordResetEmail(
            job.data.userEmail,
            job.data.userName,
            job.data.resetToken
          )
          break

        case 'manager_change':
          success = await sendManagerChangeNotification(
            job.data.userEmail,
            job.data.userName,
            job.data.managerName,
            job.data.managerDepartment
          )
          break
      }

      if (success) {
        console.log(`✅ Email sent successfully: ${job.type} (ID: ${job.id})`)
      } else {
        throw new Error(`Failed to send ${job.type} email`)
      }

    } catch (error) {
      console.error(`❌ Email failed: ${job.type} (ID: ${job.id})`, error)
      
      job.attempts++
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000 // 1s, 2s, 4s
        job.scheduledFor = new Date(Date.now() + delay)
        this.queue.push(job)
        console.log(`🔄 Retrying email in ${delay}ms: ${job.type} (ID: ${job.id})`)
      } else {
        console.error(`💀 Email permanently failed after ${job.maxAttempts} attempts: ${job.type} (ID: ${job.id})`)
      }
    } finally {
      this.currentProcessing--
      
      // Continue processing if there are more jobs
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100)
      }
    }
  }

  // Get queue status
  getStatus(): { total: number; processing: number; pending: number } {
    return {
      total: this.queue.length + this.currentProcessing,
      processing: this.currentProcessing,
      pending: this.queue.length
    }
  }

  // Clear queue (for testing)
  clearQueue(): void {
    this.queue = []
    this.currentProcessing = 0
    this.processing = false
  }
}

// Export singleton instance
export const emailQueue = new EmailQueue()

// Helper functions for easy usage
export async function queueLeaveRequestEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, leaveType: string): Promise<string> {
  return await emailQueue.addEmail('leave_request', {
    managerEmail,
    managerName,
    employeeName,
    startDate,
    endDate,
    leaveType
  })
}

export async function queueLeaveReminderEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, daysPending: number): Promise<string> {
  return await emailQueue.addEmail('leave_reminder', {
    managerEmail,
    managerName,
    employeeName,
    startDate,
    endDate,
    daysPending
  })
}

export async function queuePasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<string> {
  return await emailQueue.addEmail('password_reset', {
    userEmail,
    userName,
    resetToken
  })
}

export async function queueManagerChangeNotification(userEmail: string, userName: string, managerName: string, managerDepartment: string): Promise<string> {
  return await emailQueue.addEmail('manager_change', {
    userEmail,
    userName,
    managerName,
    managerDepartment
  })
}
