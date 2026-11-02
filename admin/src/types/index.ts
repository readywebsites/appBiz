export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_EXECUTIVE'
  | 'PROJECT_MANAGER'
  | 'PROJECT_MEMBER'
  | 'FINANCE'
  | 'SUPPORT'
  | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'QUOTE_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface Lead {
  id: string;
  reference_id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  requirements: string;
  status: LeadStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimated_budget?: string;
  service_name?: string;
  package_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  source: string;
  next_follow_up_date?: string;
  created_at: string;
  notes?: string;
}

export interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: string | number;
  total_price?: string | number;
}

export interface Quote {
  id: string;
  quote_number: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  company_name: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  valid_until?: string;
  created_at: string;
  items: QuoteItem[];
}

export interface OrderItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer: string;
  customer_name: string;
  customer_email: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  payment_status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  notes: string;
  created_at: string;
  items: OrderItem[];
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  display_order: number;
  completed_at?: string;
}

export interface Project {
  id: string;
  order_number: string;
  customer_name: string;
  title: string;
  description?: string;
  status: string;
  progress_percentage: number;
  target_delivery_date?: string;
  staging_url?: string;
  live_url?: string;
  client_notes?: string;
  internal_notes?: string;
  milestones?: ProjectMilestone[];
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_number: string;
  recipient_name: string;
  business_name: string;
  status: string;
  issue_date: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_model: string;
  target_id: string;
  change_summary: string;
  timestamp: string;
}

export interface DashboardMetrics {
  overview: {
    total_leads: number;
    new_leads: number;
    qualified_leads: number;
    won_leads: number;
    conversion_rate_percent: number;
    active_customers: number;
    total_orders: number;
    open_orders: number;
    active_projects: number;
    completed_projects: number;
    overdue_tasks: number;
    pending_quotes: number;
  };
  financials: {
    currency: string;
    total_bookings: string;
    payments_collected: string;
    invoiced_amount: string;
    outstanding_balance: string;
  };
  recent_orders: Array<{
    id: string;
    order_number: string;
    customer: string;
    amount: string;
    status: string;
    payment_status: string;
    date: string;
  }>;
  recent_leads: Array<{
    id: string;
    reference_id: string;
    name: string;
    phone: string;
    company: string;
    status: string;
    created_at: string;
  }>;
}

