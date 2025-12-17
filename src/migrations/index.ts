import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';

export const migrations = [
  {
    up: migration_20251217_102626_backup_before_switch.up,
    down: migration_20251217_102626_backup_before_switch.down,
    name: '20251217_102626_backup_before_switch'
  },
];
