export type UserRole = 'buyer' | 'owner' | 'broker' | 'admin';

// Columns safe to expose to any authenticated user.
// Used when joining on properties (owner/broker), chat counterparty, etc.
export const PUBLIC_PROFILE_COLUMNS =
  'id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at';

export type PropertyType = 'buy' | 'rent';

export type PropertyCategory = 'residential' | 'commercial';

export type BHKType = '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5+BHK';

export type FurnishingType = 'furnished' | 'semi-furnished' | 'unfurnished';

export type FacingType =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west';

export type PossessionType = 'ready' | 'under-construction';

export interface User {
  id: string;
  user_id: string;
  // email/phone are restricted by column-level GRANT — populated only for
  // the authenticated user's own profile (via get_my_contact RPC) or admin.
  email?: string;
  phone?: string;
  role: UserRole;
  name: string;
  avatar_url?: string;
  rating?: number;
  verified_broker?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  maintenance?: number;
  deposit?: number;
  type: PropertyType;
  category: PropertyCategory;
  bhk: BHKType;
  furnishing: FurnishingType;
  area_sqft: number;
  carpet_area?: number;
  super_built_up?: number;
  photos: string[];
  locality: string;
  city: string;
  address?: string;
  floor?: string;
  total_floors?: string;
  facing?: FacingType;
  possession: PossessionType;
  age_years?: number;
  amenities: string[];
  owner_id?: string;
  broker_id?: string;
  verified: boolean;
  featured: boolean;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  parkings: number;
  created_at: string;
  updated_at: string;
  owner?: User;
  broker?: User;
}

export interface Inquiry {
  id: string;
  from_user_id: string;
  to_user_id: string;
  property_id: string;
  message: string;
  read: boolean;
  created_at: string;
  from_user?: User;
  to_user?: User;
  property?: Property;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface LocalityReview {
  id: string;
  locality: string;
  city: string;
  rating: number;
  comment_count: number;
  avg_price?: number;
  created_at: string;
}

export interface SearchFilters {
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: PropertyType;
  category?: PropertyCategory;
  bhk?: BHKType[];
  furnishing?: FurnishingType[];
  minArea?: number;
  maxArea?: number;
  possession?: PossessionType;
  ownerOnly?: boolean;
  facing?: FacingType[];
  amenities?: string[];
}
export interface SearchHistory {
  id: string;
  query: string;
  filters?: SearchFilters;
  city?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  property_id?: string;
  participant_1: string;
  participant_2: string;
  last_message?: string;
  last_message_at: string;
  created_at: string;
  other_user?: User;
  property?: Property;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export type SubscriptionPlan = 'free' | 'silver' | 'gold';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled';
  starts_at: string;
  ends_at: string;
  payment_id?: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_cities: string[];
  preferred_types: PropertyType[];
  preferred_categories: PropertyCategory[];
  search_history: SearchHistory[];
  last_search_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyAlert {
  id: string;
  user_id: string;
  filters: SearchFilters;
  name: string;
  active: boolean;
  last_notified_at?: string;
  created_at: string;
}

export type SortOrder =
  | 'newest'
  | 'price_low_high'
  | 'price_high_low'
  | 'area_low_high'
  | 'area_high_low'
  | 'relevance';

export interface FloorPlan {
  name: string;
  area: number;
  price: number;
  image?: string;
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  location: string;
  city: string;
  locality?: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  launch_date?: string;
  possession_date?: string;
  rera_id?: string;
  cover_image?: string;
  gallery: string[];
  floor_plans: FloorPlan[];
  amenities: string[];
  total_units?: number;
  available_units?: number;
  tower_count?: number;
  featured: boolean;
  verified: boolean;
  created_at: string;
}

export type SiteVisitStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface SiteVisitRequest {
  id: string;
  property_id: string;
  user_id: string;
  contact_user_id?: string;
  preferred_date: string;
  slot?: string;
  name: string;
  phone: string;
  notes?: string;
  status: SiteVisitStatus;
  created_at: string;
  property?: Property;
}

export type ReportReason =
  | 'spam'
  | 'duplicate'
  | 'misleading'
  | 'sold_or_rented'
  | 'inappropriate'
  | 'fraud'
  | 'other';

export interface PropertyReport {
  id: string;
  property_id: string;
  reported_by: string;
  reason: ReportReason;
  details?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface BrokerReview {
  id: string;
  broker_id: string;
  reviewer_id: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
  reviewer?: User;
}

export interface LocalityReviewDetailed {
  id: string;
  locality: string;
  city: string;
  reviewer_id: string;
  rating: number;
  safety?: number;
  connectivity?: number;
  amenities_rating?: number;
  cleanliness?: number;
  title?: string;
  comment?: string;
  created_at: string;
  reviewer?: User;
}

export type NotificationType =
  | 'match'
  | 'price_drop'
  | 'message'
  | 'inquiry'
  | 'site_visit'
  | 'subscription'
  | 'system';

export interface InAppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface HomeLoanPartner {
  id: string;
  name: string;
  interest: string;
  processingFee: string;
  maxTenure: number;
  logo?: string;
}

export interface HomeLoanLead {
  id?: string;
  user_id?: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  loan_amount?: number;
  employment_type?: 'salaried' | 'self-employed' | 'business' | 'other';
  monthly_income?: number;
  property_id?: string;
  partner?: string;
  status?: 'new' | 'contacted' | 'converted' | 'lost';
  created_at?: string;
}

export interface FaqCategory {
  category: string;
  items: { q: string; a: string }[];
}

export interface SupportInfo {
  email: string;
  bugs_email: string;
  whatsapp: string;
  phone: string;
  hours: string;
}

export interface AboutFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface SocialLink {
  icon: string;
  label: string;
  url: string;
  color: string;
}

export interface ReportReasonItem {
  id: ReportReason;
  label: string;
}
