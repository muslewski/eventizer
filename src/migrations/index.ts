import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';
import * as migration_20260423_120000_add_offer_upload_zoom from './20260423_120000_add_offer_upload_zoom';

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
];
