import { Resend } from 'resend';

// Initialize Resend client lazily to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailNotificationData {
  managerName: string;
  managerEmail: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  requestId: string;
  websiteUrl: string;
}

export async function sendLeaveRequestNotification(data: EmailNotificationData): Promise<boolean> {
  try {
    console.log('📧 Attempting to send email notification...');
    console.log('📧 Environment check - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    const resendClient = getResendClient();
    if (!resendClient) {
      console.error('❌ Failed to initialize Resend client');
      console.error('❌ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'EXISTS' : 'MISSING');
      return false;
    }

    console.log('📧 Resend client initialized successfully');
    console.log('📧 Sending email to:', data.managerEmail);

    const { data: emailResult, error } = await resendClient.emails.send({
      from: 'Leave Tracker <noreply@leave-tracker-adria.vercel.app>',
      to: [data.managerEmail],
      subject: `Leave Request from ${data.employeeName} - Action Required`,
      html: generateLeaveRequestEmailHTML(data),
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ Email sent successfully via Resend:', emailResult?.id);
    return true;
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return false;
  }
}

function generateLeaveRequestEmailHTML(data: EmailNotificationData): string {
  const formattedStartDate = new Date(data.startDate).toLocaleDateString();
  const formattedEndDate = new Date(data.endDate).toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request Notification</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .title {
          color: #495057;
          font-size: 18px;
          margin: 0;
        }
        .content {
          margin-bottom: 30px;
        }
        .request-details {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #495057;
        }
        .detail-value {
          color: #6c757d;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background-color: #0056b3;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        .highlight {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
        .highlight-title {
          font-weight: 600;
          color: #856404;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏢 Leave Tracker</div>
          <h1 class="title">Leave Request Notification</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${data.managerName}</strong>,</p>
          
          <p>A new leave request has been submitted by one of your team members and requires your approval.</p>
          
          <div class="request-details">
            <div class="detail-row">
              <span class="detail-label">Employee:</span>
              <span class="detail-value">${data.employeeName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Leave Type:</span>
              <span class="detail-value">${data.leaveType.charAt(0).toUpperCase() + data.leaveType.slice(1)} Leave</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${formattedStartDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span class="detail-value">${formattedEndDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">${data.reason}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">${data.requestId}</span>
            </div>
          </div>
          
          <div class="highlight">
            <div class="highlight-title">⚠️ Action Required</div>
            <p>Please review and approve/reject this leave request as soon as possible.</p>
          </div>
        </div>
        
        <div class="cta-section">
          <a href="${data.websiteUrl}/admin/dashboard" class="cta-button">
            📋 Review Leave Request
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the Leave Tracker system.</p>
          <p>If you have any questions, please contact your system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}


