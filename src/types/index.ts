export interface User {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
  city: string;
  country: string;
  rating: number;
  verified: boolean;
  subscription_tier: 'basic' | 'premium' | 'enterprise';
  tagline: string;
  description: string;
  phone: string;
  categories: string[];
}

export interface Resource {
  id: string;
  supplierId: string;
  category: string;
  subcategory: string;
  status: 'available' | 'booked' | 'available_soon';
  availabilityStart: string;
  availabilityEnd: string;
  specs: Record<string, string | number | boolean>;
}

export type RFQStatus =
  | 'new'
  | 'supplier_responded'
  | 'negotiation'
  | 'accepted'
  | 'confirmed'
  | 'completed'
  | 'rejected';

export interface SupplierResponse {
  supplierId: string;
  quoteAmount: number;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  allocatedResources: string[];
  createdAt: string;
}

export interface RFQ {
  id: string;
  contractorId: string;
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  country: string;
  city: string;
  region: string;
  startDate: string;
  endDate: string;
  status: RFQStatus;
  createdAt: string;
  supplierResponses: SupplierResponse[];
}

export type JobStatus = 'confirmed' | 'in_progress' | 'completed';

export interface Job {
  id: string;
  rfqId: string;
  supplierId: string;
  contractorId: string;
  allocatedResources: string[];
  startDate: string;
  endDate: string;
  status: JobStatus;
  workOrderUrl: string;
}

export interface Review {
  id: string;
  jobId: string;
  contractorId: string;
  supplierId: string;
  rating: number;
  text: string;
  createdAt: string;
}

export type NotificationType =
  | 'rfq_broadcast'
  | 'rfq_response'
  | 'rfq_confirmed'
  | 'job_completed'
  | 'review_request'
  | 'new_quote';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
