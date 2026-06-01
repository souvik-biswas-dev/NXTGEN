CREATE TABLE "admin_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"action" text NOT NULL,
	"subject_type" text,
	"subject_id" text,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broker_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broker_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "broker_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"rera_id" text NOT NULL,
	"agency_name" text,
	"years_experience" integer,
	"id_document_url" text NOT NULL,
	"rera_document_url" text NOT NULL,
	"agency_document_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"reviewer_notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "broker_verifications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "city_centroids" (
	"city" text PRIMARY KEY NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"participant_1" uuid NOT NULL,
	"participant_2" uuid NOT NULL,
	"last_message" text,
	"last_message_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "home_loan_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"city" text,
	"loan_amount" bigint,
	"employment_type" text,
	"monthly_income" bigint,
	"property_id" uuid,
	"partner" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locality_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locality" text NOT NULL,
	"city" text NOT NULL,
	"rating" numeric(3, 2) NOT NULL,
	"comment_count" integer DEFAULT 0,
	"avg_price" bigint,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locality_reviews_detailed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locality" text NOT NULL,
	"city" text NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"safety" integer,
	"connectivity" integer,
	"amenities_rating" integer,
	"cleanliness" integer,
	"title" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"counter_amount" bigint,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"channel" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"amount_paise" bigint NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"plan" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"notes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "platform_data" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"developer" text NOT NULL,
	"location" text NOT NULL,
	"city" text NOT NULL,
	"locality" text,
	"description" text,
	"price_min" bigint,
	"price_max" bigint,
	"launch_date" text,
	"possession_date" text,
	"rera_id" text,
	"cover_image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"floor_plans" jsonb DEFAULT '[]'::jsonb,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"total_units" integer,
	"available_units" integer,
	"tower_count" integer,
	"featured" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" bigint NOT NULL,
	"maintenance" bigint DEFAULT 0,
	"deposit" bigint DEFAULT 0,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"bhk" text NOT NULL,
	"furnishing" text NOT NULL,
	"area_sqft" integer NOT NULL,
	"carpet_area" integer,
	"super_built_up" integer,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"locality" text NOT NULL,
	"city" text NOT NULL,
	"address" text,
	"floor" text,
	"total_floors" text,
	"facing" text,
	"possession" text NOT NULL,
	"age_years" integer,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"owner_id" uuid,
	"broker_id" uuid,
	"verified" boolean DEFAULT false,
	"featured" boolean DEFAULT false,
	"bedrooms" integer DEFAULT 0 NOT NULL,
	"bathrooms" integer DEFAULT 0 NOT NULL,
	"kitchens" integer DEFAULT 0 NOT NULL,
	"parkings" integer DEFAULT 0 NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"locality_lat" double precision,
	"locality_lng" double precision,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filters" jsonb NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"reported_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"viewer_id" uuid,
	"viewed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limits_user_id_action_window_start_pk" PRIMARY KEY("user_id","action","window_start")
);
--> statement-breakpoint
CREATE TABLE "recently_viewed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "site_visit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_user_id" uuid,
	"preferred_date" timestamp with time zone NOT NULL,
	"slot" text,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now(),
	"ends_at" timestamp with time zone NOT NULL,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_cities" text[] DEFAULT '{}',
	"preferred_types" text[] DEFAULT '{}',
	"preferred_categories" text[] DEFAULT '{}',
	"search_history" jsonb DEFAULT '[]'::jsonb,
	"notifications" jsonb DEFAULT jsonb_build_object('matched', true, 'new_launches', false, 'property_news', false, 'price_drop', true) NOT NULL,
	"last_search_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"google_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "users_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text,
	"phone" text,
	"name" text,
	"role" text NOT NULL,
	"avatar_url" text,
	"rating" numeric(3, 2) DEFAULT '0.0',
	"verified_broker" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_broker_id_users_profiles_user_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_reviewer_id_users_profiles_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_verifications" ADD CONSTRAINT "broker_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_verifications" ADD CONSTRAINT "broker_verifications_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_1_users_profiles_user_id_fk" FOREIGN KEY ("participant_1") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_2_users_profiles_user_id_fk" FOREIGN KEY ("participant_2") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_loan_leads" ADD CONSTRAINT "home_loan_leads_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_loan_leads" ADD CONSTRAINT "home_loan_leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_from_user_id_users_profiles_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_to_user_id_users_profiles_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locality_reviews_detailed" ADD CONSTRAINT "locality_reviews_detailed_reviewer_id_users_profiles_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_profiles_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_from_user_id_users_profiles_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_to_user_id_users_profiles_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_profiles_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_broker_id_users_profiles_user_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_alerts" ADD CONSTRAINT "property_alerts_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_reports" ADD CONSTRAINT "property_reports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_reports" ADD CONSTRAINT "property_reports_reported_by_users_profiles_user_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_viewer_id_users_profiles_user_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visit_requests" ADD CONSTRAINT "site_visit_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visit_requests" ADD CONSTRAINT "site_visit_requests_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visit_requests" ADD CONSTRAINT "site_visit_requests_contact_user_id_users_profiles_user_id_fk" FOREIGN KEY ("contact_user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_profiles" ADD CONSTRAINT "users_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_actor" ON "admin_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_subject" ON "admin_audit_log" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_broker_review" ON "broker_reviews" USING btree ("broker_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_broker_reviews_broker" ON "broker_reviews" USING btree ("broker_id");--> statement-breakpoint
CREATE INDEX "idx_broker_verif_status" ON "broker_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_broker_verif_submitted" ON "broker_verifications" USING btree ("submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_conversation" ON "conversations" USING btree ("property_id","participant_1","participant_2");--> statement-breakpoint
CREATE INDEX "idx_conversations_participant_1" ON "conversations" USING btree ("participant_1");--> statement-breakpoint
CREATE INDEX "idx_conversations_participant_2" ON "conversations" USING btree ("participant_2");--> statement-breakpoint
CREATE INDEX "idx_conversations_last_message_at" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_favorites_user_property" ON "favorites" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_user" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_property" ON "favorites" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_home_loan_leads_user" ON "home_loan_leads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_in_app_notifications_user" ON "in_app_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inquiries_from_user" ON "inquiries" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_inquiries_to_user" ON "inquiries" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_inquiries_property" ON "inquiries" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_locality_review" ON "locality_reviews" USING btree ("locality","city");--> statement-breakpoint
CREATE INDEX "idx_locality_reviews_detailed_loc" ON "locality_reviews_detailed" USING btree ("locality","city");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_offers_property" ON "offers" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_offers_from" ON "offers" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_offers_to" ON "offers" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_otp_identifier" ON "otp_codes" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_payments_user" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_city" ON "projects" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_projects_featured" ON "projects" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_properties_city" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_properties_locality" ON "properties" USING btree ("locality");--> statement-breakpoint
CREATE INDEX "idx_properties_type" ON "properties" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_properties_category" ON "properties" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_properties_price" ON "properties" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_properties_featured" ON "properties" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_properties_owner_id" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_properties_broker_id" ON "properties" USING btree ("broker_id");--> statement-breakpoint
CREATE INDEX "idx_property_alerts_user" ON "property_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reports_property" ON "property_reports" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "property_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_property_views_property" ON "property_views" USING btree ("property_id","viewed_at");--> statement-breakpoint
CREATE INDEX "idx_property_views_viewer" ON "property_views" USING btree ("viewer_id");--> statement-breakpoint
CREATE INDEX "idx_push_tokens_user" ON "push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_rate_limits_cleanup" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_recently_viewed" ON "recently_viewed" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE INDEX "idx_recently_viewed_user" ON "recently_viewed" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_site_visits_user" ON "site_visit_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_site_visits_contact" ON "site_visit_requests" USING btree ("contact_user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_active_subscription" ON "subscriptions" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");