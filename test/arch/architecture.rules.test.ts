// test/arch/architecture.rules.test.ts
//
// ArchUnit rules that validate required layer folders exist.
//
// Uses Node.js fs to check if folders exist.

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Folder existence tests
// ---------------------------------------------------------------------------

describe('Folder Structure Validation', () => {
  const srcPath = path.join(process.cwd(), 'src');

  test('src/contracts folder must exist', () => {
    const folderPath = path.join(srcPath, 'contracts');
    expect(fs.existsSync(folderPath)).toBe(true);
  });

  test('src/domain folder must exist', () => {
    const folderPath = path.join(srcPath, 'domain');
    expect(fs.existsSync(folderPath)).toBe(true);
  });

  test('src/data folder must exist', () => {
    const folderPath = path.join(srcPath, 'data');
    expect(fs.existsSync(folderPath)).toBe(true);
  });

  test('src/presentation folder must exist', () => {
    const folderPath = path.join(srcPath, 'presentation');
    expect(fs.existsSync(folderPath)).toBe(true);
  });

  test('src/di folder must exist', () => {
    const folderPath = path.join(srcPath, 'di');
    expect(fs.existsSync(folderPath)).toBe(true);
  });
});
