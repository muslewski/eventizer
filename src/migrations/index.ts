import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';
import * as migration_20260423_120000_add_offer_upload_zoom from './20260423_120000_add_offer_upload_zoom';
import * as migration_20260430_022634_add_billing_tier_fields from './20260430_022634_add_billing_tier_fields';
import * as migration_20260430_164705_relax_subscription_plans_required_columns from './20260430_164705_relax_subscription_plans_required_columns';
import * as migration_20260512_000000_processed_stripe_events_collection from './20260512_000000_processed_stripe_events_collection';
import * as migration_20260512_133000_add_processed_stripe_events_to_locked_documents from './20260512_133000_add_processed_stripe_events_to_locked_documents';

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
];
