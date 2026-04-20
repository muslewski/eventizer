import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';

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
];
