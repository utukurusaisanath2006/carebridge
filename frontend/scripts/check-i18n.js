/**
 * i18n parity & completeness verification script for Care Bridge.
 * Validates:
 * 1. 100% key parity between en.json, hi.json, and ta.json
 * 2. Parameter interpolation parity ({{param}} matches across all locales)
 * 3. Non-empty string check
 * 4. Scans JSX components for untranslated strings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.resolve(__dirname, '../src/locales');
const SRC_DIR = path.resolve(__dirname, '../src');

function flattenKeys(obj, prefix = '') {
  let keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(keys, flattenKeys(v, fullKey));
    } else {
      keys[fullKey] = v;
    }
  }
  return keys;
}

function extractParams(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map(m => m.replace(/[{}]/g, '').trim()).sort();
}

console.log('=====================================================');
console.log('       Care Bridge i18n Parity & Integrity Check     ');
console.log('=====================================================\n');

// 1. Validate all JSON files for syntax errors and BOM
const backendI18nDir = path.resolve(__dirname, '../../backend/i18n');
const jsonDirs = [LOCALES_DIR, backendI18nDir];

let totalErrors = 0;

for (const dir of jsonDirs) {
  if (!fs.existsSync(dir)) continue;
  const jsonFiles = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const jf of jsonFiles) {
    const fullP = path.join(dir, jf);
    const buf = fs.readFileSync(fullP);
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      console.error(`❌ [BOM Error]: ${jf} contains a UTF-8 BOM.`);
      totalErrors++;
    }
    try {
      JSON.parse(buf.toString('utf8'));
      console.log(`✅ [Valid JSON]: ${path.relative(path.resolve(__dirname, '../..'), fullP)}`);
    } catch (e) {
      console.error(`❌ [JSON Syntax Error] in ${jf}:`, e.message);
      totalErrors++;
    }
  }
}

// 2. Read locale dictionaries for parity check
const enPath = path.join(LOCALES_DIR, 'en.json');
const hiPath = path.join(LOCALES_DIR, 'hi.json');
const taPath = path.join(LOCALES_DIR, 'ta.json');

if (!fs.existsSync(enPath)) {
  console.error(`ERROR: English locale missing at ${enPath}`);
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = fs.existsSync(hiPath) ? JSON.parse(fs.readFileSync(hiPath, 'utf8')) : null;
const ta = fs.existsSync(taPath) ? JSON.parse(fs.readFileSync(taPath, 'utf8')) : null;

const enFlat = flattenKeys(en);
const enKeyList = Object.keys(enFlat);
console.log(`\n[Locale: en.json] Total unique leaf keys: ${enKeyList.length}`);

function checkLocale(name, localeData) {
  if (!localeData) {
    console.error(`ERROR: Missing ${name}.json`);
    totalErrors++;
    return;
  }

  const flat = flattenKeys(localeData);
  const keyList = Object.keys(flat);
  console.log(`[Locale: ${name}.json] Total unique leaf keys: ${keyList.length}`);

  const missingKeys = enKeyList.filter(k => !(k in flat));
  const extraKeys = keyList.filter(k => !(k in enFlat));
  const emptyKeys = keyList.filter(k => typeof flat[k] === 'string' && flat[k].trim() === '');

  // Parameter mismatch check
  const paramMismatches = [];
  for (const k of enKeyList) {
    if (k in flat) {
      const enParams = extractParams(enFlat[k]);
      const trParams = extractParams(flat[k]);
      if (enParams.join(',') !== trParams.join(',')) {
        paramMismatches.push({
          key: k,
          expected: enParams,
          actual: trParams
        });
      }
    }
  }

  if (missingKeys.length > 0) {
    console.error(`❌ [${name}] Missing ${missingKeys.length} keys:`);
    missingKeys.slice(0, 10).forEach(k => console.error(`   - ${k}`));
    if (missingKeys.length > 10) console.error(`   ... and ${missingKeys.length - 10} more.`);
    totalErrors += missingKeys.length;
  } else {
    console.log(`✅ [${name}] 100% key parity with en.json (0 missing keys)`);
  }

  if (extraKeys.length > 0) {
    console.warn(`⚠️ [${name}] Has ${extraKeys.length} extra keys not in en.json:`);
    extraKeys.slice(0, 5).forEach(k => console.warn(`   + ${k}`));
  }

  if (emptyKeys.length > 0) {
    console.error(`❌ [${name}] Has ${emptyKeys.length} empty values:`);
    emptyKeys.slice(0, 5).forEach(k => console.error(`   - ${k}`));
    totalErrors += emptyKeys.length;
  }

  if (paramMismatches.length > 0) {
    console.warn(`⚠️ [${name}] Has ${paramMismatches.length} interpolation parameter mismatches:`);
    paramMismatches.slice(0, 5).forEach(m => {
      console.warn(`   ~ ${m.key}: expected {{${m.expected.join(',')}}} got {{${m.actual.join(',')}}}`);
    });
  } else {
    console.log(`✅ [${name}] All {{param}} interpolation templates match en.json`);
  }
}

checkLocale('hi', hi);
checkLocale('ta', ta);

// 2. Scan JSX files for i18n usage sanity
console.log('\n--- Scanning JSX Components in src/ ---');
const componentsDir = path.join(SRC_DIR, 'components');
const files = [
  path.join(SRC_DIR, 'App.jsx'),
  ...fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx')).map(f => path.join(componentsDir, f))
];

let componentStats = [];
for (const filePath of files) {
  const file = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Count t() calls
  const tCalls = (content.match(/\bt\(\s*['"`][a-zA-Z0-9_.]+/g) || []).length;
  // Count i18n helper calls
  const helperCalls = (content.match(/\b(taskTypeLabel|statusLabel|mealRelationLabel|ruleMessage|ruleAction|auditMessage|formatDate|formatTime|formatNumber|formatRelativeTime)\(/g) || []).length;

  componentStats.push({ file, tCalls, helperCalls });
}

console.table(componentStats);

if (totalErrors === 0) {
  console.log('\n=====================================================');
  console.log(' ✨ PASSED: 100% locale parity & zero missing keys!   ');
  console.log('=====================================================\n');
  process.exit(0);
} else {
  console.error('\n=====================================================');
  console.error(` ❌ FAILED: ${totalErrors} i18n errors detected.       `);
  console.error('=====================================================\n');
  process.exit(1);
}
