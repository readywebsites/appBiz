import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // When running in Expo Go on a physical device, dynamically extract the Metro host IP
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('exp.direct')) {
      return `http://${host}:8000/api/v1`;
    }
  }

  // Fallback for physical device on LAN vs emulator vs simulator vs web
  return Platform.select({
    android: 'http://192.168.1.16:8000/api/v1',
    default: 'http://localhost:8000/api/v1',
  }) || 'http://localhost:8000/api/v1';
}

export const API_BASE_URL = getApiBaseUrl();

class MobileApiClient {
  private async getAccessToken(): Promise<string | null> {
    return storage.getItem('biz499_access_token');
  }

  private async getRefreshToken(): Promise<string | null> {
    return storage.getItem('biz499_refresh_token');
  }

  public async setTokens(access: string, refresh: string) {
    await storage.setItem('biz499_access_token', access);
    await storage.setItem('biz499_refresh_token', refresh);
  }

  public async clearTokens() {
    await storage.removeItem('biz499_access_token');
    await storage.removeItem('biz499_refresh_token');
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await this.getAccessToken();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token refresh
    if (response.status === 401) {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        const refreshed = await this.refreshToken(refreshToken);
        if (refreshed) {
          const newToken = await this.getAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          await this.clearTokens();
          throw new Error('Your session has expired. Please sign in again.');
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.error ||
        errorData.detail ||
        errorData.message ||
        Object.values(errorData)[0] ||
        'Network request failed';
      throw new Error(String(message));
    }

    return response.json();
  }

  private async refreshToken(refresh: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (res.ok) {
        const data = await res.json();
        await storage.setItem('biz499_access_token', data.access);
        if (data.refresh) await storage.setItem('biz499_refresh_token', data.refresh);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth
  async register(data: any) {
    const res = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.tokens) await this.setTokens(res.tokens.access, res.tokens.refresh);
    return res;
  }

  async login(credentials: { email: string; password: string }) {
    const res = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.tokens) await this.setTokens(res.tokens.access, res.tokens.refresh);
    return res;
  }

  async sendPhoneOtp(phone: string) {
    return this.request('/auth/phone/send-otp/', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPhoneOtp(payload: {
    phone: string;
    otp: string;
    full_name?: string;
    business_name?: string;
    email?: string;
  }) {
    const res = await this.request('/auth/phone/verify-otp/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.tokens) await this.setTokens(res.tokens.access, res.tokens.refresh);
    return res;
  }

  async loginWithEmail(credentials: { email: string; password: string }) {
    const res = await this.request('/auth/email/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.tokens) await this.setTokens(res.tokens.access, res.tokens.refresh);
    return res;
  }

  async sendEmailOtp(email: string) {
    return this.request('/auth/email/send-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmailOtp(payload: { email: string; otp: string }) {
    const res = await this.request('/auth/email/verify-otp/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.tokens) await this.setTokens(res.tokens.access, res.tokens.refresh);
    return res;
  }

  async logoutBackend(refreshToken?: string) {
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Ignore network errors on logout
    }
    await this.clearTokens();
  }

  async getMe() {
    const token = await this.getAccessToken();
    if (!token) return null;
    return this.request('/auth/me/');
  }

  async updateProfile(data: any) {
    return this.request('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.request('/auth/delete-account/', { method: 'POST' });
  }

  // Catalog
  async getCategories() {
    return this.request('/services/categories/');
  }

  async getServices(categorySlug?: string) {
    const query = categorySlug ? `?category=${categorySlug}` : '';
    return this.request(`/services/items/${query}`);
  }

  async getServiceDetail(slug: string) {
    return this.request(`/services/items/${slug}/`);
  }

  async getPackages(serviceId?: string) {
    const query = serviceId ? `?service_id=${serviceId}` : '';
    return this.request(`/services/packages/${query}`);
  }

  async getBanners() {
    return this.request('/services/banners/');
  }

  async getPortfolio(featured?: boolean) {
    const query = featured ? '?featured=true' : '';
    return this.request(`/services/portfolio/${query}`);
  }

  async getTestimonials() {
    return this.request('/services/testimonials/');
  }

  // Quotations & Estimates
  async calculateEstimate(payload: { package_id: string; addon_ids?: string[]; coupon_code?: string }) {
    return this.request('/quotations/estimate/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyQuotes() {
    return this.request('/quotations/');
  }

  async acceptQuote(id: string) {
    return this.request(`/quotations/${id}/accept/`, { method: 'POST' });
  }

  // Customer Acquisition & Leads
  async submitEnquiry(payload: {
    full_name: string;
    email: string;
    phone: string;
    company_name?: string;
    requirements: string;
    estimated_budget?: string;
    service_id?: string;
    package_id?: string;
    campaign?: string;
    source?: string;
    referral_code?: string;
  }) {
    return this.request('/leads/submit-enquiry/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async bookConsultation(payload: {
    name: string;
    email: string;
    phone: string;
    preferred_date: string;
    preferred_time_slot: string;
    topic?: string;
    notes?: string;
  }) {
    return this.request('/leads/consultations/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Orders & Checkout
  async checkout(payload: {
    package_id: string;
    addon_ids?: string[];
    coupon_code?: string;
    notes?: string;
  }) {
    return this.request('/orders/checkout/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyOrders() {
    return this.request('/orders/');
  }

  async cancelOrder(id: string, reason?: string) {
    return this.request(`/orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async validateCoupon(code: string, subtotal: string) {
    return this.request(`/orders/coupons/validate/?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
  }

  // Payments
  async initiatePayment(order_id: string, is_advance: boolean = false) {
    return this.request('/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify({ order_id, is_advance }),
    });
  }

  async verifyPayment(payload: {
    gateway_order_id: string;
    gateway_payment_id: string;
    gateway_signature: string;
  }) {
    return this.request('/payments/verify/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Projects
  async getMyProjects() {
    return this.request('/projects/');
  }

  async getProjectDetail(id: string) {
    return this.request(`/projects/${id}/`);
  }

  async requestRevision(projectId: string, payload: { title: string; description: string }) {
    return this.request(`/projects/${projectId}/request-revision/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async approveProject(projectId: string, approval_type: string = 'FINAL_DELIVERY_SIGN_OFF', comments?: string) {
    return this.request(`/projects/${projectId}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ approval_type, comments }),
    });
  }

  async getProjectRequirements(projectId: string) {
    return this.request(`/projects/${projectId}/requirements/`);
  }

  async saveProjectRequirements(projectId: string, payload: any, submit: boolean = false) {
    return this.request(`/projects/${projectId}/requirements/`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, action: submit ? 'submit' : 'save' }),
    });
  }

  async uploadProjectAsset(projectId: string, formData: FormData) {
    return this.request(`/projects/${projectId}/upload-asset/`, {
      method: 'POST',
      body: formData,
    });
  }

  async getProjectDomainHosting(projectId: string) {
    return this.request(`/projects/${projectId}/domain-hosting/`);
  }

  async requestDomainRenewal(projectId: string, notes?: string) {
    return this.request(`/projects/${projectId}/domain-hosting/`, {
      method: 'POST',
      body: JSON.stringify({ action: 'request_renewal', notes }),
    });
  }

  async getProjectReview(projectId: string) {
    return this.request(`/projects/${projectId}/review/`);
  }

  async submitProjectReview(projectId: string, payload: { rating: number; headline?: string; feedback: string; testimonial_permission?: boolean }) {
    return this.request(`/projects/${projectId}/review/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Purchased Services & Subscriptions
  async getMyServices() {
    return this.request('/services/my-services/');
  }

  // Referrals
  async getReferrals() {
    return this.request('/auth/referrals/');
  }

  // Invoices
  async getMyInvoices() {
    return this.request('/invoices/');
  }

  getInvoicePdfUrl(id: string) {
    return `${API_BASE_URL}/invoices/${id}/pdf/`;
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications/');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read/`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read/', { method: 'POST' });
  }

  async registerDevice(push_token: string, platform: 'ANDROID' | 'IOS' = 'ANDROID') {
    return this.request('/notifications/devices/', {
      method: 'POST',
      body: JSON.stringify({ push_token, platform }),
    });
  }

  // Support
  async getTickets() {
    return this.request('/support/');
  }

  async createTicket(payload: {
    subject: string;
    category: string;
    priority: string;
    initial_message: string;
    project?: string;
    order?: string;
  }) {
    return this.request('/support/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTicketDetail(id: string) {
    return this.request(`/support/${id}/`);
  }

  async replyTicket(ticketId: string, message: string) {
    return this.request(`/support/${ticketId}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async closeTicket(ticketId: string) {
    return this.request(`/support/${ticketId}/close/`, {
      method: 'POST',
    });
  }

  async reopenTicket(ticketId: string) {
    return this.request(`/support/${ticketId}/reopen/`, {
      method: 'POST',
    });
  }
}

export const api = new MobileApiClient();

