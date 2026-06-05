import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';
import * as migration_20260423_120000_add_offer_upload_zoom from './20260423_120000_add_offer_upload_zoom';
import * as migration_20260430_022634_add_billing_tier_fields from './20260430_022634_add_billing_tier_fields';
import * as migration_20260430_164705_relax_subscription_plans_required_columns from './20260430_164705_relax_subscription_plans_required_columns';
import * as migration_20260512_000000_processed_stripe_events_collection from './20260512_000000_processed_stripe_events_collection';
import * as migration_20260512_133000_add_processed_stripe_events_to_locked_documents from './20260512_133000_add_processed_stripe_events_to_locked_documents';
import * as migration_20260512_135000_ensure_processed_stripe_events_schema from './20260512_135000_ensure_processed_stripe_events_schema';
import * as migration_20260523_180000_add_partners_block from './20260523_180000_add_partners_block';
import * as migration_20260523_190000_add_partners_upload_relationship_columns from './20260523_190000_add_partners_upload_relationship_columns';
import * as migration_20260526_120000_add_event_types from './20260526_120000_add_event_types';
import * as migration_20260526_120500_seed_event_types from './20260526_120500_seed_event_types';
import * as migration_20260526_121000_fix_event_types_order_type from './20260526_121000_fix_event_types_order_type';
import * as migration_20260603_120000_add_partners_collection_and_v2_block from './20260603_120000_add_partners_collection_and_v2_block';
import * as migration_20260603_120500_seed_partners from './20260603_120500_seed_partners';
import * as migration_20260605_120000_add_partner_show_on_sign_in from './20260605_120000_add_partner_show_on_sign_in';
import * as migration_20260605_130000_partner_accent_hex from './20260605_130000_partner_accent_hex';
import * as migration_20260605_140000_partners_v1_to_v2_home_onas from './20260605_140000_partners_v1_to_v2_home_onas';

export const migrations = [
  {
    up: migration_20251217_102626_backup_before_switch.up,
    down: migration_20251217_102626_backup_before_switch.down,
    name: '20251217_102626_backup_before_switch'
  },
  {
    up: migration_20260420_204841_add_offer_website.up,
    down: migration_20260420_204841_add_offer_website.down,
    name: '20260420_204841_add_offer_website'
  },
  {
    up: migration_20260423_120000_add_offer_upload_zoom.up,
    down: migration_20260423_120000_add_offer_upload_zoom.down,
    name: '20260423_120000_add_offer_upload_zoom'
  },
  {
    up: migration_20260430_022634_add_billing_tier_fields.up,
    down: migration_20260430_022634_add_billing_tier_fields.down,
    name: '20260430_022634_add_billing_tier_fields'
  },
  {
    up: migration_20260430_164705_relax_subscription_plans_required_columns.up,
    down: migration_20260430_164705_relax_subscription_plans_required_columns.down,
    name: '20260430_164705_relax_subscription_plans_required_columns'
  },
  {
    up: migration_20260512_000000_processed_stripe_events_collection.up,
    down: migration_20260512_000000_processed_stripe_events_collection.down,
    name: '20260512_000000_processed_stripe_events_collection'
  },
  {
    up: migration_20260512_133000_add_processed_stripe_events_to_locked_documents.up,
    down: migration_20260512_133000_add_processed_stripe_events_to_locked_documents.down,
    name: '20260512_133000_add_processed_stripe_events_to_locked_documents'
  },
  {
    up: migration_20260512_135000_ensure_processed_stripe_events_schema.up,
    down: migration_20260512_135000_ensure_processed_stripe_events_schema.down,
    name: '20260512_135000_ensure_processed_stripe_events_schema'
  },
  {
    up: migration_20260523_180000_add_partners_block.up,
    down: migration_20260523_180000_add_partners_block.down,
    name: '20260523_180000_add_partners_block'
  },
  {
    up: migration_20260523_190000_add_partners_upload_relationship_columns.up,
    down: migration_20260523_190000_add_partners_upload_relationship_columns.down,
    name: '20260523_190000_add_partners_upload_relationship_columns'
  },
  {
    up: migration_20260526_120000_add_event_types.up,
    down: migration_20260526_120000_add_event_types.down,
    name: '20260526_120000_add_event_types'
  },
  {
    up: migration_20260526_120500_seed_event_types.up,
    down: migration_20260526_120500_seed_event_types.down,
    name: '20260526_120500_seed_event_types'
  },
  {
    up: migration_20260526_121000_fix_event_types_order_type.up,
    down: migration_20260526_121000_fix_event_types_order_type.down,
    name: '20260526_121000_fix_event_types_order_type'
  },
  {
    up: migration_20260603_120000_add_partners_collection_and_v2_block.up,
    down: migration_20260603_120000_add_partners_collection_and_v2_block.down,
    name: '20260603_120000_add_partners_collection_and_v2_block'
  },
  {
    up: migration_20260603_120500_seed_partners.up,
    down: migration_20260603_120500_seed_partners.down,
    name: '20260603_120500_seed_partners'
  },
  {
    up: migration_20260605_120000_add_partner_show_on_sign_in.up,
    down: migration_20260605_120000_add_partner_show_on_sign_in.down,
    name: '20260605_120000_add_partner_show_on_sign_in'
  },
  {
    up: migration_20260605_130000_partner_accent_hex.up,
    down: migration_20260605_130000_partner_accent_hex.down,
    name: '20260605_130000_partner_accent_hex'
  },
  {
    up: migration_20260605_140000_partners_v1_to_v2_home_onas.up,
    down: migration_20260605_140000_partners_v1_to_v2_home_onas.down,
    name: '20260605_140000_partners_v1_to_v2_home_onas'
  },
];
