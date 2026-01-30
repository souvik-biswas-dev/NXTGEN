export type UserRole = 'buyer' | 'owner' | 'broker';

export type PropertyType = 'buy' | 'rent';

export type PropertyCategory = 'residential' | 'commercial';

export type BHKType = '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5+BHK';

export type FurnishingType = 'furnished' | 'semi-furnished' | 'unfurnished';

export type FacingType = 'north' | 'south' | 'east' | 'west' | 'north-east' | 'north-west' | 'south-east' | 'south-west';

export type PossessionType = 'ready' | 'under-construction';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  name: string;
  avatar_url?: string;
  rating?: number;
  verified_broker?: boolean;
  created_at: string;
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
