import { describe, expect, it } from 'vitest';
import { backupFilename } from './api';

describe('backupFilename', () => {
  it('uses a quoted filename from Content-Disposition', () => {
    expect(backupFilename('attachment; filename="backup-file.db"')).toBe('backup-file.db');
  });

  it('uses an unquoted filename from Content-Disposition', () => {
    expect(backupFilename('attachment; filename=backup-file.db')).toBe('backup-file.db');
  });

  it('generates a UTC timestamped filename when the header has no filename', () => {
    const now = new Date('2024-04-05T06:07:08.000Z');
    const expected = 'switchbot_backup_20240405_060708.db';

    expect(backupFilename(null, now)).toBe(expected);
    expect(backupFilename('', now)).toBe(expected);
  });
});
