export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  customer_profile?: CustomerProfile;
}

export interface CustomerProfile {
  id: string;
  business_name: string;
  industry: string;
  website_url?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  referral_code?: string;
  marketing_consent: boolean;
  whatsapp_updates: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  services_count: number;
}

export interface PackageFeature {
  id: string;
  title: string;
  is_included: boolean;
  display_order: number;
}

export interface PackageAddOn {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
}

export interface ServicePackage {
  id: string;
  service: string;
  name: string;
  slug: string;
  tagline: string;
  price: string;
  original_price?: string;
  currency: string;
  delivery_days: number;
  is_popular: boolean;
  features: PackageFeature[];
}

export interface Service {
  id: string;
  category: string;
  category_name: string;
  title: string;
  slug: string;
  short_description: string;
  full_description?: string;
  icon: string;
  image_url: string;
  starting_price: string;
  currency: string;
  is_featured: boolean;
  packages?: ServicePackage[];
  add_ons?: PackageAddOn[];
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image_url: string;
  cta_text: string;
  cta_action: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  client_name: string;
  industry: string;
  thumbnail_url: string;
  tags: string;
  live_url?: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  business_name: string;
  designation: string;
  rating: number;
  feedback: string;
  avatar_url?: string;
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
  status: string;
  payment_status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  created_at: string;
  items: OrderItem[];
  has_project: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Project {
  id: string;
  order_number: string;
  title: string;
  description?: string;
  status: string;
  progress_percentage: number;
  target_delivery_date?: string;
  staging_url?: string;
  live_url?: string;
  client_notes?: string;
  milestones?: ProjectMilestone[];
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_number: string;
  status: string;
  issue_date: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  messages?: Array<{
    id: string;
    sender_name: string;
    message: string;
    is_staff_reply: boolean;
    created_at: string;
  }>;
}

