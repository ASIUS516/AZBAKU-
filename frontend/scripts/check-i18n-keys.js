// Run with: node scripts/check-i18n-keys.js
// Fails (non-zero exit code) if ru.json / en.json / az.json don't have exactly the same set of keys.
// This exists specifically to prevent the "half the page translated" bug from the LUXE MAISON project.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.join(__dirname, '..', 'src', 'i18n');

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const locales = ['ru', 'en', 'az'];
const keysByLocale = {};

for (const locale of locales) {
  const filePath = path.join(i18nDir, `${locale}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  keysByLocale[locale] = new Set(flattenKeys(content));
}

let hasError = false;
const allKeys = new Set(locales.flatMap(l => [...keysByLocale[l]]));

for (const key of allKeys) {
  const missingFrom = locales.filter(l => !keysByLocale[l].has(key));
  if (missingFrom.length > 0) {
    hasError = true;
    console.error(`Key "${key}" is missing from: ${missingFrom.join(', ')}`);
  }
}

if (hasError) {
  console.error('\ni18n key check FAILED. Fix the missing keys above before shipping.');
  process.exit(1);
} else {
  console.log(`i18n key check passed. All ${allKeys.size} keys exist in ru, en and az.`);
}
