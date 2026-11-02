const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('biz499_admin_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('biz499_admin_refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    localStorage.setItem('biz499_admin_access_token', access);
    localStorage.setItem('biz499_admin_refresh_token', refresh);
  }

  public clearTokens() {
    localStorage.removeItem('biz499_admin_access_token');
    localStorage.removeItem('biz499_admin_refresh_token');
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle Token Expiry & Refresh
    if (response.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        response = await fetch(url, { ...options, headers });
      } else {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please sign in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData) || 'Request failed';
      throw new Error(message);
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refresh = this.getRefreshToken();
      if (!refresh) return false;
      const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('biz499_admin_access_token', data.access);
        if (data.refresh) localStorage.setItem('biz499_admin_refresh_token', data.refresh);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Invalid email or password');
    }
    const data = await res.json();
    this.setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  }

  async getMe() {
    return this.request('/auth/me/');
  }

  // Dashboard Metrics
  async getDashboardMetrics() {
    return this.request('/analytics/dashboard/');
  }

  // Leads CRM
  async listLeads(params: { status?: string; search?: string } = {}) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/leads/manage/?${query}`);
  }

  async updateLead(id: string, data: any) {
    return this.request(`/leads/manage/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addLeadActivity(id: string, activity: { activity_type: string; summary: string; details?: string }) {
    return this.request(`/leads/manage/${id}/add-activity/`, {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  async convertLead(id: string) {
    return this.request(`/leads/manage/${id}/convert/`, {
      method: 'POST',
    });
  }

  // Quotations
  async listQuotes() {
    return this.request('/quotations/');
  }

  async createQuote(data: any) {
    return this.request('/quotations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptQuote(id: string) {
    return this.request(`/quotations/${id}/accept/`, {
      method: 'POST',
    });
  }

  getQuotePdfUrl(id: string) {
    return `${API_BASE_URL}/quotations/${id}/pdf/`;
  }

  // Orders
  async listOrders() {
    return this.request('/orders/');
  }

  async cancelOrder(id: string, reason: string) {
    return this.request(`/orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Projects
  async listProjects() {
    return this.request('/projects/');
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}/`);
  }

  async updateProject(id: string, data: any) {
    return this.request(`/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Invoices
  async listInvoices() {
    return this.request('/invoices/');
  }

  getInvoicePdfUrl(id: string) {
    return `${API_BASE_URL}/invoices/${id}/pdf/`;
  }

  // Services Catalog
  async listCategories() {
    return this.request('/services/categories/');
  }

  async listServices() {
    return this.request('/services/items/');
  }

  async listPackages() {
    return this.request('/services/packages/');
  }

  // Support
  async listTickets() {
    return this.request('/support/');
  }

  async replyTicket(id: string, message: string) {
    return this.request(`/support/${id}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Audit Logs
  async listAuditLogs() {
    return this.request('/audit/');
  }
}

export const api = new ApiClient();

