// ============================================================
// Drizzle schema — full port of the 26 Supabase tables.
// Changes from Supabase:
//   • `auth.users` (managed by Supabase) is replaced by our own
//     `users` table holding credentials. `users_profiles.user_id`
//     references it. Everywhere a column referenced auth.users(id)
//     it now references users(id) (same UUID space).
//   • RLS policies and DB triggers are gone — that logic lives in
//     the API layer (middleware + route handlers).
// ============================================================
import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  boolean,
  doublePrecision,
  numeric,
  timestamp,
  jsonb,
  bigserial,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── AUTH ─────────────────────────────────────────────────────────
// Replaces Supabase's managed auth.users. Holds login credentials and
// federated-identity links. Profile data stays in users_profiles.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique(),
    phone: text('phone').unique(),
    passwordHash: text('password_hash'), // null for OAuth-only / OTP-only accounts
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
    googleId: text('google_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index('idx_users_email').on(t.email),
    phoneIdx: index('idx_users_phone').on(t.phone),
  })
);

// Persisted, revocable refresh tokens (rotating). Stored hashed.
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_refresh_tokens_user').on(t.userId),
  })
);

// Short-lived one-time codes for phone (and optional email) OTP login.
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(), // phone (E.164) or email
    channel: text('channel').notNull(), // 'phone' | 'email'
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    identIdx: index('idx_otp_identifier').on(t.identifier),
  })
);

// ── PROFILES ─────────────────────────────────────────────────────
export const usersProfiles = pgTable(
  'users_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: text('email'),
    phone: text('phone'),
    name: text('name'),
    role: text('role').notNull(), // 'buyer' | 'owner' | 'broker' | 'admin'
    avatarUrl: text('avatar_url'),
    rating: numeric('rating', { precision: 3, scale: 2 }).default('0.0'),
    verifiedBroker: boolean('verified_broker').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  }
);

// ── PROPERTIES ───────────────────────────────────────────────────
export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    price: bigint('price', { mode: 'number' }).notNull(),
    maintenance: bigint('maintenance', { mode: 'number' }).default(0),
    deposit: bigint('deposit', { mode: 'number' }).default(0),
    type: text('type').notNull(), // 'buy' | 'rent'
    category: text('category').notNull(), // 'residential' | 'commercial'
    bhk: text('bhk').notNull(),
    furnishing: text('furnishing').notNull(),
    areaSqft: integer('area_sqft').notNull(),
    carpetArea: integer('carpet_area'),
    superBuiltUp: integer('super_built_up'),
    photos: jsonb('photos').default(sql`'[]'::jsonb`),
    locality: text('locality').notNull(),
    city: text('city').notNull(),
    address: text('address'),
    floor: text('floor'),
    totalFloors: text('total_floors'),
    facing: text('facing'),
    possession: text('possession').notNull(), // 'ready' | 'under-construction'
    ageYears: integer('age_years'),
    amenities: jsonb('amenities').default(sql`'[]'::jsonb`),
    ownerId: uuid('owner_id').references(() => usersProfiles.userId, { onDelete: 'set null' }),
    brokerId: uuid('broker_id').references(() => usersProfiles.userId, { onDelete: 'set null' }),
    verified: boolean('verified').default(false),
    featured: boolean('featured').default(false),
    bedrooms: integer('bedrooms').default(0).notNull(),
    bathrooms: integer('bathrooms').default(0).notNull(),
    kitchens: integer('kitchens').default(0).notNull(),
    parkings: integer('parkings').default(0).notNull(),
    // geo (migration 010) + locality coords (migration 004)
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    localityLat: doublePrecision('locality_lat'),
    localityLng: doublePrecision('locality_lng'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    cityIdx: index('idx_properties_city').on(t.city),
    localityIdx: index('idx_properties_locality').on(t.locality),
    typeIdx: index('idx_properties_type').on(t.type),
    categoryIdx: index('idx_properties_category').on(t.category),
    priceIdx: index('idx_properties_price').on(t.price),
    featuredIdx: index('idx_properties_featured').on(t.featured),
    ownerIdx: index('idx_properties_owner_id').on(t.ownerId),
    brokerIdx: index('idx_properties_broker_id').on(t.brokerId),
  })
);

// ── INQUIRIES ────────────────────────────────────────────────────
export const inquiries = pgTable(
  'inquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    read: boolean('read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    fromIdx: index('idx_inquiries_from_user').on(t.fromUserId),
    toIdx: index('idx_inquiries_to_user').on(t.toUserId),
    propIdx: index('idx_inquiries_property').on(t.propertyId),
  })
);

// ── FAVORITES ────────────────────────────────────────────────────
export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('uniq_favorites_user_property').on(t.userId, t.propertyId),
    userIdx: index('idx_favorites_user').on(t.userId),
    propIdx: index('idx_favorites_property').on(t.propertyId),
  })
);

// ── RECENTLY VIEWED ──────────────────────────────────────────────
export const recentlyViewed = pgTable(
  'recently_viewed',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('uniq_recently_viewed').on(t.userId, t.propertyId),
    userIdx: index('idx_recently_viewed_user').on(t.userId),
  })
);

// ── PROPERTY VIEWS (analytics) ───────────────────────────────────
export const propertyViews = pgTable(
  'property_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    viewerId: uuid('viewer_id').references(() => usersProfiles.userId, { onDelete: 'set null' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    propIdx: index('idx_property_views_property').on(t.propertyId, t.viewedAt),
    viewerIdx: index('idx_property_views_viewer').on(t.viewerId),
  })
);

// ── PROPERTY ALERTS (saved searches) ─────────────────────────────
export const propertyAlerts = pgTable(
  'property_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    filters: jsonb('filters').notNull(),
    name: text('name').notNull(),
    active: boolean('active').default(true),
    lastNotifiedAt: timestamp('last_notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_property_alerts_user').on(t.userId),
  })
);

// ── PROPERTY REPORTS ─────────────────────────────────────────────
export const propertyReports = pgTable(
  'property_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    reportedBy: uuid('reported_by')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    propIdx: index('idx_reports_property').on(t.propertyId),
    statusIdx: index('idx_reports_status').on(t.status),
  })
);

// ── OFFERS (Phase 9: make-an-offer / price negotiation) ──────────
export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    message: text('message'),
    status: text('status').notNull().default('pending'), // pending|accepted|rejected|countered|withdrawn
    counterAmount: bigint('counter_amount', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    propIdx: index('idx_offers_property').on(t.propertyId),
    fromIdx: index('idx_offers_from').on(t.fromUserId),
    toIdx: index('idx_offers_to').on(t.toUserId),
  })
);

// ── CHAT ─────────────────────────────────────────────────────────
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
    participant1: uuid('participant_1')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    participant2: uuid('participant_2')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    lastMessage: text('last_message'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('uniq_conversation').on(t.propertyId, t.participant1, t.participant2),
    p1Idx: index('idx_conversations_participant_1').on(t.participant1),
    p2Idx: index('idx_conversations_participant_2').on(t.participant2),
    lastIdx: index('idx_conversations_last_message_at').on(t.lastMessageAt),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    read: boolean('read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    convIdx: index('idx_messages_conversation').on(t.conversationId),
    senderIdx: index('idx_messages_sender').on(t.senderId),
    createdIdx: index('idx_messages_created_at').on(t.createdAt),
  })
);

// ── PROJECTS (new launches) ──────────────────────────────────────
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    developer: text('developer').notNull(),
    location: text('location').notNull(),
    city: text('city').notNull(),
    locality: text('locality'),
    description: text('description'),
    priceMin: bigint('price_min', { mode: 'number' }),
    priceMax: bigint('price_max', { mode: 'number' }),
    launchDate: text('launch_date'),
    possessionDate: text('possession_date'),
    reraId: text('rera_id'),
    coverImage: text('cover_image'),
    gallery: jsonb('gallery').default(sql`'[]'::jsonb`),
    floorPlans: jsonb('floor_plans').default(sql`'[]'::jsonb`),
    amenities: jsonb('amenities').default(sql`'[]'::jsonb`),
    totalUnits: integer('total_units'),
    availableUnits: integer('available_units'),
    towerCount: integer('tower_count'),
    featured: boolean('featured').default(false),
    verified: boolean('verified').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    cityIdx: index('idx_projects_city').on(t.city),
    featuredIdx: index('idx_projects_featured').on(t.featured),
  })
);

// ── SITE VISITS ──────────────────────────────────────────────────
export const siteVisitRequests = pgTable(
  'site_visit_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    contactUserId: uuid('contact_user_id').references(() => usersProfiles.userId, {
      onDelete: 'set null',
    }),
    preferredDate: timestamp('preferred_date', { withTimezone: true }).notNull(),
    slot: text('slot'),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_site_visits_user').on(t.userId),
    contactIdx: index('idx_site_visits_contact').on(t.contactUserId),
  })
);

// ── REVIEWS ──────────────────────────────────────────────────────
export const brokerReviews = pgTable(
  'broker_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brokerId: uuid('broker_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    title: text('title'),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('uniq_broker_review').on(t.brokerId, t.reviewerId),
    brokerIdx: index('idx_broker_reviews_broker').on(t.brokerId),
  })
);

export const localityReviews = pgTable(
  'locality_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locality: text('locality').notNull(),
    city: text('city').notNull(),
    rating: numeric('rating', { precision: 3, scale: 2 }).notNull(),
    commentCount: integer('comment_count').default(0),
    avgPrice: bigint('avg_price', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('uniq_locality_review').on(t.locality, t.city),
  })
);

export const localityReviewsDetailed = pgTable(
  'locality_reviews_detailed',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locality: text('locality').notNull(),
    city: text('city').notNull(),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    safety: integer('safety'),
    connectivity: integer('connectivity'),
    amenitiesRating: integer('amenities_rating'),
    cleanliness: integer('cleanliness'),
    title: text('title'),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    locIdx: index('idx_locality_reviews_detailed_loc').on(t.locality, t.city),
  })
);

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const inAppNotifications = pgTable(
  'in_app_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    data: jsonb('data').default(sql`'{}'::jsonb`),
    read: boolean('read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_in_app_notifications_user').on(t.userId, t.createdAt),
  })
);

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    platform: text('platform'), // 'ios' | 'android' | 'web'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_push_tokens_user').on(t.userId),
  })
);

// ── SUBSCRIPTIONS & PAYMENTS ─────────────────────────────────────
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    plan: text('plan').notNull(), // 'free' | 'silver' | 'gold'
    status: text('status').notNull().default('active'),
    startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    paymentId: text('payment_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_subscriptions_user').on(t.userId),
    statusIdx: index('idx_subscriptions_status').on(t.status),
    uniqActive: uniqueIndex('uniq_active_subscription')
      .on(t.userId)
      .where(sql`status = 'active'`),
  })
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    razorpayOrderId: text('razorpay_order_id').unique(),
    razorpayPaymentId: text('razorpay_payment_id').unique(),
    razorpaySignature: text('razorpay_signature'),
    amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default('INR'),
    plan: text('plan').notNull(), // 'silver' | 'gold'
    status: text('status').notNull().default('created'),
    notes: jsonb('notes').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_payments_user').on(t.userId),
    statusIdx: index('idx_payments_status').on(t.status),
  })
);

// ── BROKER VERIFICATION ──────────────────────────────────────────
export const brokerVerifications = pgTable(
  'broker_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    reraId: text('rera_id').notNull(),
    agencyName: text('agency_name'),
    yearsExperience: integer('years_experience'),
    idDocumentUrl: text('id_document_url').notNull(),
    reraDocumentUrl: text('rera_document_url').notNull(),
    agencyDocumentUrl: text('agency_document_url'),
    status: text('status').notNull().default('pending'),
    reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    reviewerNotes: text('reviewer_notes'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('idx_broker_verif_status').on(t.status),
    submittedIdx: index('idx_broker_verif_submitted').on(t.submittedAt),
  })
);

// ── USER PREFERENCES ─────────────────────────────────────────────
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => usersProfiles.userId, { onDelete: 'cascade' }),
    preferredCities: text('preferred_cities').array().default(sql`'{}'`),
    preferredTypes: text('preferred_types').array().default(sql`'{}'`),
    preferredCategories: text('preferred_categories').array().default(sql`'{}'`),
    searchHistory: jsonb('search_history').default(sql`'[]'::jsonb`),
    notifications: jsonb('notifications')
      .notNull()
      .default(
        sql`jsonb_build_object('matched', true, 'new_launches', false, 'property_news', false, 'price_drop', true)`
      ),
    lastSearchAt: timestamp('last_search_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_user_preferences_user').on(t.userId),
  })
);

// ── HOME LOAN LEADS ──────────────────────────────────────────────
export const homeLoanLeads = pgTable(
  'home_loan_leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersProfiles.userId, { onDelete: 'set null' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    city: text('city'),
    loanAmount: bigint('loan_amount', { mode: 'number' }),
    employmentType: text('employment_type'),
    monthlyIncome: bigint('monthly_income', { mode: 'number' }),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
    partner: text('partner'),
    status: text('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_home_loan_leads_user').on(t.userId),
  })
);

// ── GEO ──────────────────────────────────────────────────────────
export const cityCentroids = pgTable('city_centroids', {
  city: text('city').primaryKey(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
});

// ── PLATFORM DATA (CMS-style key/value blobs) ────────────────────
export const platformData = pgTable('platform_data', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── RATE LIMITS ──────────────────────────────────────────────────
export const rateLimits = pgTable(
  'rate_limits',
  {
    userId: uuid('user_id').notNull(),
    action: text('action').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.action, t.windowStart] }),
    cleanupIdx: index('idx_rate_limits_cleanup').on(t.windowStart),
  })
);

// ── ADMIN AUDIT LOG ──────────────────────────────────────────────
export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id'),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    subjectType: text('subject_type'),
    subjectId: text('subject_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    actorIdx: index('idx_audit_actor').on(t.actorId),
    subjectIdx: index('idx_audit_subject').on(t.subjectType, t.subjectId),
    createdIdx: index('idx_audit_created').on(t.createdAt),
  })
);
