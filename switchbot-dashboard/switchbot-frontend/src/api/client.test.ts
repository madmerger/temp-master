import { describe, expect, it } from 'vitest';
import { parseBackupFilename } from './client';

describe('parseBackupFilename', () => {
  it('Content-Disposition からファイル名を取り出す', () => {
    expect(parseBackupFilename('attachment; filename="switchbot_backup_20261022_000000.db"')).toBe(
      'switchbot_backup_20261022_000000.db',
    );
    expect(parseBackupFilename('attachment; filename=a.db')).toBe('a.db');
  });

  it('ヘッダが無い場合は既定名', () => {
    expect(parseBackupFilename(null)).toBe('switchbot_backup.db');
    expect(parseBackupFilename('attachment')).toBe('switchbot_backup.db');
  });
});
