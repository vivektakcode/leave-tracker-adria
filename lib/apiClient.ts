class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Authentication methods
  async login(username: string, password: string) {
    return this.request<{ user: any; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  }

  async signup(userData: any) {
    return this.request<{ id: string; message: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async verifyToken() {
    return this.request<{ user: any; valid: boolean }>('/api/auth/verify')
  }

  // User methods
  async getUserBalance(userId?: string) {
    const params = userId ? `?userId=${userId}` : ''
    return this.request<{ balance: any }>(`/api/user/balance${params}`)
  }

  async getUserRequests(userId?: string) {
    const params = userId ? `?userId=${userId}` : ''
    return this.request<{ requests: any[] }>(`/api/user/requests${params}`)
  }

  // Leave request methods
  async createLeaveRequest(requestData: any) {
    return this.request<{ id: string }>('/api/leave-requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
  }

  async getAllLeaveRequests() {
    return this.request<{ leaveRequests: any[] }>('/api/leave-requests')
  }

  async processLeaveRequest(requestId: string, status: string, managerId: string, comments?: string) {
    return this.request<{ success: boolean }>('/api/leave-requests', {
      method: 'PUT',
      body: JSON.stringify({ requestId, status, managerId, comments })
    })
  }

  // Admin methods
  async getAdminDashboard() {
    return this.request<{
      pendingRequests: any[]
      teamMembers: number
      totalPending: number
    }>('/api/admin/dashboard')
  }

  async getUsers(scope: 'team' | 'all' = 'team') {
    return this.request<{ users: any[] }>(`/api/admin/users?scope=${scope}`)
  }

  async approveLeaveRequest(requestId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/admin/requests/${requestId}/approve`, {
      method: 'POST'
    })
  }

  async rejectLeaveRequest(requestId: string, comments?: string) {
    return this.request<{ success: boolean; message: string }>(`/api/admin/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export the class for testing or custom instances
export { ApiClient }
