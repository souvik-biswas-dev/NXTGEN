import { z } from 'zod';

// ============================================================
// Shared Zod schemas for every user-input form.
// Single source of truth — import from here, don't inline rules.
// ============================================================

// Strips HTML / control chars to avoid unicode tricks in titles/descriptions.
const plainText = (min: number, max: number, field = 'Field') =>
  z
    .string()
    .trim()
    .min(min, `${field} must be at least ${min} characters`)
    .max(max, `${field} must be at most ${max} characters`)
    .regex(/^[^\u0000-\u001F\u007F<>]+$/u, `${field} contains invalid characters`);

// Indian mobile format. Accepts +91 prefix or bare 10 digits starting 6-9.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

// NIST-recommended: ≥ 8 chars, at least one letter + one digit. No upper limit arbitrarily low,
// but cap at 72 (bcrypt limit).
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a digit');

// --- Auth ----------------------------------------------------

export const signupSchema = z
  .object({
    username: plainText(2, 60, 'Name'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

// --- Profile -------------------------------------------------

export const profileUpdateSchema = z.object({
  name: plainText(2, 60, 'Name').optional(),
  phone: phoneSchema.optional().or(z.literal('')),
  avatar_url: z.string().url().max(2048).optional().or(z.literal('')),
  role: z.enum(['buyer', 'owner', 'broker']).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// --- Property post -------------------------------------------

// Reasonable ceilings for Indian real-estate. Adjust as the market requires.
const MIN_PRICE = 1_000; // ₹1 000
const MAX_PRICE = 10_000_00_00_000; // ₹10 000 Cr (effectively unbounded)
const MIN_AREA = 50; // 50 sqft
const MAX_AREA = 1_000_000; // 1 M sqft

export const propertyPostSchema = z
  .object({
    title: plainText(8, 120, 'Title'),
    description: plainText(20, 5_000, 'Description'),
    price: z.number().int().min(MIN_PRICE).max(MAX_PRICE),
    maintenance: z.number().int().min(0).max(MAX_PRICE).optional(),
    deposit: z.number().int().min(0).max(MAX_PRICE).optional(),
    type: z.enum(['buy', 'rent']),
    category: z.enum(['residential', 'commercial']),
    bhk: z.enum(['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK']),
    furnishing: z.enum(['furnished', 'semi-furnished', 'unfurnished']),
    area_sqft: z.number().int().min(MIN_AREA).max(MAX_AREA),
    carpet_area: z.number().int().min(MIN_AREA).max(MAX_AREA).optional(),
    super_built_up: z.number().int().min(MIN_AREA).max(MAX_AREA).optional(),
    photos: z.array(z.string().url()).min(1, 'Add at least one photo').max(15, 'Max 15 photos'),
    locality: plainText(2, 120, 'Locality'),
    city: plainText(2, 80, 'City'),
    address: plainText(0, 500, 'Address').optional().or(z.literal('')),
    floor: z.string().max(20).optional().or(z.literal('')),
    total_floors: z.string().max(20).optional().or(z.literal('')),
    facing: z
      .enum([
        'north',
        'south',
        'east',
        'west',
        'north-east',
        'north-west',
        'south-east',
        'south-west',
      ])
      .optional(),
    possession: z.enum(['ready', 'under-construction']),
    age_years: z.number().int().min(0).max(200).optional(),
    amenities: z.array(z.string().max(64)).max(50).default([]),
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(20),
    kitchens: z.number().int().min(0).max(10),
    parkings: z.number().int().min(0).max(20),
  })
  .refine((d) => !d.carpet_area || d.carpet_area <= d.area_sqft, {
    path: ['carpet_area'],
    message: 'Carpet area must not exceed total area',
  });
export type PropertyPostInput = z.infer<typeof propertyPostSchema>;

// --- Inquiry / Chat message ----------------------------------

export const inquirySchema = z.object({
  property_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  message: plainText(10, 2_000, 'Message'),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2_000, 'Message too long'),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// --- Broker verification ------------------------------------

export const brokerVerificationSchema = z.object({
  full_name: plainText(2, 120, 'Full name'),
  // RERA numbers vary by state — keep it permissive but bounded.
  rera_id: z
    .string()
    .trim()
    .regex(/^[A-Z0-9/\-]{4,40}$/i, 'Enter a valid RERA ID'),
  agency_name: plainText(0, 120, 'Agency').optional().or(z.literal('')),
  years_experience: z.number().int().min(0).max(80).optional(),
  id_document_url: z.string().url(),
  rera_document_url: z.string().url(),
  agency_document_url: z.string().url().optional().or(z.literal('')),
});
export type BrokerVerificationInput = z.infer<typeof brokerVerificationSchema>;

// --- Helper: flatten Zod errors into a single user-facing string ---

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message || 'Invalid input';
}
