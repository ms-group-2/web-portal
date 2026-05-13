// ── Enums ──────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type BusinessType = 'seller' | 'service' | 'both';

export type ReminderChannel = 'notification';
export type ProviderCallType = 'OUTCALL' | 'ONSITE' | 'BOTH';
export type ProviderBusinessType = 'INDIVIDUAL' | 'COMPANY';

// ── Catalog ────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  parent_id: number | null;
  name: string;
  icon_uri: string;
}

// ── Provider / Branch ──────────────────────────────────────────────

export interface BranchRequest {
  name: string;
}

export interface BranchUpdateRequest {
  name?: string;
  is_active?: boolean;
}

export interface BranchResponse {
  id: string;
  provider_id: string;
  name: string;
  address_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressRequest {
  city_id: number;
  details: string;
}

export interface ProviderProfileRequest {
  name: string;
  description?: string;
  phone_number: string;
  call_type?: ProviderCallType;
  business_type?: ProviderBusinessType;
  category_id?: number;
}

export interface ProviderProfileResponse {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  phone_number: string;
  call_type: string | null;
  business_type: string | null;
  activity_status: string;
  category_id: number | null;
  address_id: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Service Offering ───────────────────────────────────────────────

export interface ServiceOfferingRequest {
  name: string;
  description: string;
  session_duration: number;
  session_price: number;
  capacity?: number;
  branch_id?: string;
}

export interface ServiceOfferingUpdateRequest {
  name?: string;
  description?: string;
  session_duration?: number;
  session_price?: number;
  capacity?: number;
  is_active?: boolean;
}

export interface ServiceOfferingResponse {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  session_duration: number;
  session_price: number;
  capacity: number;
  is_active: boolean;
  branch_id: string | null;
  photo_url: string | null;
}

// ── Availability ───────────────────────────────────────────────────

export interface AvailabilityRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  branch_id?: string;
}

export interface AvailabilityResponse {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  branch_id: string | null;
}

// ── Schedule Exceptions ────────────────────────────────────────────

export interface ScheduleExceptionRequest {
  exception_date: string;
  is_closed: boolean;
  start_time?: string;
  end_time?: string;
}

export interface ScheduleExceptionResponse {
  id: string;
  provider_id: string;
  exception_date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
}

// ── Resources ──────────────────────────────────────────────────────

export interface ResourceRequest {
  name: string;
  branch_id?: string;
}

export interface ResourceResponse {
  id: string;
  provider_id: string;
  name: string;
  is_active: boolean;
  branch_id: string | null;
  photo_url: string | null;
}

export interface LinkResourceRequest {
  resource_id: string;
}

// ── Bookings ───────────────────────────────────────────────────────

export interface BookingCreateRequest {
  provider_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time?: string;
  resource_id?: string;
}

export interface BookingResponse {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  resource_id: string | null;
  booking_date: string;
  start_time: string;
  duration: number;
  total_price: number;
  status: BookingStatus;
  booked_at: string;
  updated_at: string;
  branch_id: string | null;
  series_id: string | null;
  order_id: string | null;
  payment_url: string | null;
}

export interface RescheduleBookingRequest {
  booking_date: string;
  start_time: string;
}

// ── Booking Series ─────────────────────────────────────────────────

export interface BookingSeriesCreateRequest {
  provider_id: string;
  service_id: string;
  start_time: string;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  resource_id?: string;
}

export interface BookingSeriesResponse {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  start_time: number;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  branch_id: string | null;
  created_at: string;
  bookings: BookingResponse[];
}

// ── Reviews ────────────────────────────────────────────────────────

export interface ReviewCreateRequest {
  provider_id: string;
  rating: number;
  comment: string;
}

export interface ReviewUpdateRequest {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ── Reminders ──────────────────────────────────────────────────────

export interface ReminderCreateRequest {
  offset_minutes: number;
  channel: ReminderChannel;
}

export interface ReminderResponse {
  id: string;
  offset_minutes: number;
  channel: string;
}

// ── Slots ──────────────────────────────────────────────────────────

export interface SlotResponse {
  start_time: string;
  end_time: string;
  available: boolean;
}

// ── Provider Profile (referenced in dashboard) ─────────────────────

export interface ProviderDashboardResponse {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
}
