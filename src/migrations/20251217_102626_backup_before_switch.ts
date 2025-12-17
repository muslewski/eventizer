import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'moderator', 'service-provider', 'client');
  CREATE TYPE "public"."enum_offers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__offers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_picture_id" integer,
  	"role" "enum_users_role" DEFAULT 'client',
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"email_verified" boolean DEFAULT false NOT NULL,
  	"image" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id_id" integer NOT NULL,
  	"token" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id_id" integer NOT NULL,
  	"account_id" varchar NOT NULL,
  	"provider_id" varchar NOT NULL,
  	"access_token" varchar,
  	"refresh_token" varchar,
  	"access_token_expires_at" timestamp(3) with time zone,
  	"refresh_token_expires_at" timestamp(3) with time zone,
  	"scope" varchar,
  	"id_token" varchar,
  	"password" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_verifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"identifier" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'Media',
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "profile_pictures" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"prefix" varchar DEFAULT 'Profile Pictures',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "offer_uploads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"offer_id" integer NOT NULL,
  	"prefix" varchar DEFAULT 'Offer Uploads',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "offers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"title" varchar DEFAULT 'Nowa oferta',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_offers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_offers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_user_id" integer,
  	"version_title" varchar DEFAULT 'Nowa oferta',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__offers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"user_sessions_id" integer,
  	"user_accounts_id" integer,
  	"user_verifications_id" integer,
  	"media_id" integer,
  	"profile_pictures_id" integer,
  	"offer_uploads_id" integer,
  	"offers_id" integer,
  	"payload_folders_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD CONSTRAINT "users_profile_picture_id_profile_pictures_id_fk" FOREIGN KEY ("profile_picture_id") REFERENCES "public"."profile_pictures"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_id_users_id_fk" FOREIGN KEY ("user_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_id_users_id_fk" FOREIGN KEY ("user_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profile_pictures" ADD CONSTRAINT "profile_pictures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_uploads" ADD CONSTRAINT "offer_uploads_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offers" ADD CONSTRAINT "offers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offers_v" ADD CONSTRAINT "_offers_v_parent_id_offers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offers_v" ADD CONSTRAINT "_offers_v_version_user_id_users_id_fk" FOREIGN KEY ("version_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_sessions_fk" FOREIGN KEY ("user_sessions_id") REFERENCES "public"."user_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_accounts_fk" FOREIGN KEY ("user_accounts_id") REFERENCES "public"."user_accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_verifications_fk" FOREIGN KEY ("user_verifications_id") REFERENCES "public"."user_verifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_pictures_fk" FOREIGN KEY ("profile_pictures_id") REFERENCES "public"."profile_pictures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offer_uploads_fk" FOREIGN KEY ("offer_uploads_id") REFERENCES "public"."offer_uploads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offers_fk" FOREIGN KEY ("offers_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_profile_picture_idx" ON "users" USING btree ("profile_picture_id");
  CREATE INDEX "users_name_idx" ON "users" USING btree ("name");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id_id");
  CREATE UNIQUE INDEX "user_sessions_token_idx" ON "user_sessions" USING btree ("token");
  CREATE INDEX "user_sessions_ip_address_idx" ON "user_sessions" USING btree ("ip_address");
  CREATE INDEX "user_sessions_updated_at_idx" ON "user_sessions" USING btree ("updated_at");
  CREATE INDEX "user_sessions_created_at_idx" ON "user_sessions" USING btree ("created_at");
  CREATE INDEX "user_accounts_user_id_idx" ON "user_accounts" USING btree ("user_id_id");
  CREATE INDEX "user_accounts_provider_id_idx" ON "user_accounts" USING btree ("provider_id");
  CREATE INDEX "user_accounts_updated_at_idx" ON "user_accounts" USING btree ("updated_at");
  CREATE INDEX "user_accounts_created_at_idx" ON "user_accounts" USING btree ("created_at");
  CREATE INDEX "user_verifications_updated_at_idx" ON "user_verifications" USING btree ("updated_at");
  CREATE INDEX "user_verifications_created_at_idx" ON "user_verifications" USING btree ("created_at");
  CREATE INDEX "media_user_idx" ON "media" USING btree ("user_id");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "profile_pictures_user_idx" ON "profile_pictures" USING btree ("user_id");
  CREATE INDEX "profile_pictures_updated_at_idx" ON "profile_pictures" USING btree ("updated_at");
  CREATE INDEX "profile_pictures_created_at_idx" ON "profile_pictures" USING btree ("created_at");
  CREATE UNIQUE INDEX "profile_pictures_filename_idx" ON "profile_pictures" USING btree ("filename");
  CREATE INDEX "offer_uploads_offer_idx" ON "offer_uploads" USING btree ("offer_id");
  CREATE INDEX "offer_uploads_updated_at_idx" ON "offer_uploads" USING btree ("updated_at");
  CREATE INDEX "offer_uploads_created_at_idx" ON "offer_uploads" USING btree ("created_at");
  CREATE UNIQUE INDEX "offer_uploads_filename_idx" ON "offer_uploads" USING btree ("filename");
  CREATE INDEX "offers_user_idx" ON "offers" USING btree ("user_id");
  CREATE INDEX "offers_updated_at_idx" ON "offers" USING btree ("updated_at");
  CREATE INDEX "offers_created_at_idx" ON "offers" USING btree ("created_at");
  CREATE INDEX "offers__status_idx" ON "offers" USING btree ("_status");
  CREATE INDEX "_offers_v_parent_idx" ON "_offers_v" USING btree ("parent_id");
  CREATE INDEX "_offers_v_version_version_user_idx" ON "_offers_v" USING btree ("version_user_id");
  CREATE INDEX "_offers_v_version_version_updated_at_idx" ON "_offers_v" USING btree ("version_updated_at");
  CREATE INDEX "_offers_v_version_version_created_at_idx" ON "_offers_v" USING btree ("version_created_at");
  CREATE INDEX "_offers_v_version_version__status_idx" ON "_offers_v" USING btree ("version__status");
  CREATE INDEX "_offers_v_created_at_idx" ON "_offers_v" USING btree ("created_at");
  CREATE INDEX "_offers_v_updated_at_idx" ON "_offers_v" USING btree ("updated_at");
  CREATE INDEX "_offers_v_latest_idx" ON "_offers_v" USING btree ("latest");
  CREATE INDEX "_offers_v_autosave_idx" ON "_offers_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_user_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("user_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_user_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("user_accounts_id");
  CREATE INDEX "payload_locked_documents_rels_user_verifications_id_idx" ON "payload_locked_documents_rels" USING btree ("user_verifications_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_profile_pictures_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_pictures_id");
  CREATE INDEX "payload_locked_documents_rels_offer_uploads_id_idx" ON "payload_locked_documents_rels" USING btree ("offer_uploads_id");
  CREATE INDEX "payload_locked_documents_rels_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("offers_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users" CASCADE;
  DROP TABLE "user_sessions" CASCADE;
  DROP TABLE "user_accounts" CASCADE;
  DROP TABLE "user_verifications" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "profile_pictures" CASCADE;
  DROP TABLE "offer_uploads" CASCADE;
  DROP TABLE "offers" CASCADE;
  DROP TABLE "_offers_v" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_offers_status";
  DROP TYPE "public"."enum__offers_v_version_status";
  DROP TYPE "public"."enum_payload_folders_folder_type";`)
}
