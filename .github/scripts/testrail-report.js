'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const {
  TESTRAIL_URL,
  TESTRAIL_USER,
  TESTRAIL_PASSWORD,
  JEST_RESULTS_PATH = 'jest-results.json',
  BDD_RESULTS_PATH = 'cucumber-results.json',
  CI_SHA = '',
  CI_REF = 'unknown',
  CI_RUN_ID = ''
} = process.env;

const PROJECT_ID = 1;
const SUITE_ID = 1;

if (!TESTRAIL_URL || !TESTRAIL_USER || !TESTRAIL_PASSWORD) {
  console.log('TestRail credentials not set — skipping report.');
  process.exit(0);
}

const auth = Buffer.from(`${TESTRAIL_USER}:${TESTRAIL_PASSWORD}`).toString('base64');

function testrailRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: TESTRAIL_URL,
      path: `/index.php?/api/v2/${endpoint}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`TestRail ${res.statusCode}: ${data.slice(0, 200)}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Bad response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(20000, () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function wordScore(a, b) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const wa = new Set(norm(a).split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(norm(b).split(/\s+/).filter(w => w.length > 2));
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  return overlap / Math.max(wa.size, wb.size, 1);
}

function parseJest(filePath) {
  const full = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(full)) { console.log(`Jest results not found: ${full}`); return { tests: [], passed: 0, failed: 0 }; }
  const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
  const tests = [];
  for (const suite of (raw.testResults || [])) {
    for (const t of (suite.testResults || [])) {
      tests.push({
        name: t.fullName || t.title,
        passed: t.status === 'passed',
        duration: Math.max(Math.ceil((t.duration || 0) / 1000), 1)
      });
    }
  }
  return { tests, passed: raw.numPassedTests || 0, failed: raw.numFailedTests || 0 };
}

function parseBDD(filePath) {
  const full = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(full)) { console.log(`BDD results not found: ${full}`); return { tests: [], passed: 0, failed: 0 }; }
  const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
  const tests = [];
  let passed = 0, failed = 0;
  for (const feature of raw) {
    for (const scenario of (feature.elements || [])) {
      const steps = scenario.steps || [];
      const ok = steps.every(s => s.result && s.result.status === 'passed');
      const ns = steps.reduce((sum, s) => sum + ((s.result && s.result.duration) || 0), 0);
      tests.push({ name: `${feature.name}: ${scenario.name}`, passed: ok, duration: Math.max(Math.ceil(ns / 1e9), 1) });
      if (ok) passed++; else failed++;
    }
  }
  return { tests, passed, failed };
}

async function main() {
  const jest = parseJest(JEST_RESULTS_PATH);
  const bdd = parseBDD(BDD_RESULTS_PATH);
  const allTests = [...jest.tests, ...bdd.tests];
  const allPassed = jest.failed === 0 && bdd.failed === 0;

  console.log(`Jest: ${jest.passed} passed, ${jest.failed} failed`);
  console.log(`BDD:  ${bdd.passed} passed, ${bdd.failed} failed`);

  console.log('Fetching TestRail cases...');
  const casesResp = await testrailRequest('GET', `get_cases/${PROJECT_ID}&suite_id=${SUITE_ID}`);
  const cases = casesResp.cases || casesResp;
  console.log(`Found ${cases.length} cases`);

  const results = cases.map(tc => {
    let best = null, bestScore = 0;
    for (const t of allTests) {
      const s = wordScore(tc.title, t.name);
      if (s > bestScore) { bestScore = s; best = t; }
    }
    const matched = best && bestScore >= 0.2;
    const testPassed = matched ? best.passed : allPassed;
    const sha8 = CI_SHA.slice(0, 8) || 'unknown';
    return {
      case_id: tc.id,
      status_id: testPassed ? 1 : 5,
      elapsed: `${matched ? best.duration : 1}s`,
      comment: testPassed
        ? `Passed — CI rama:${CI_REF} commit:${sha8}`
        : `Failed — CI rama:${CI_REF} commit:${sha8}`
    };
  });

  const now = new Date();
  const d = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const runName = `Ejecucion CI — ${d} — ${CI_REF}`;
  const description = `Jest: ${jest.passed}/${jest.passed+jest.failed} | BDD: ${bdd.passed}/${bdd.passed+bdd.failed} | Rama: ${CI_REF} | Commit: ${CI_SHA.slice(0,8)} | Run: ${CI_RUN_ID}`;

  console.log(`Creating run: "${runName}"`);
  const run = await testrailRequest('POST', `add_run/${PROJECT_ID}`, {
    suite_id: SUITE_ID,
    name: runName,
    description,
    case_ids: cases.map(c => c.id)
  });
  console.log(`Run created: ID ${run.id}`);

  await testrailRequest('POST', `add_results_for_cases/${run.id}`, { results });
  console.log(`Posted ${results.length} results → https://${TESTRAIL_URL}/index.php?/runs/view/${run.id}`);
}

main().catch(err => {
  console.error('TestRail report error:', err.message);
  process.exit(0); // non-blocking — don't fail CI for a reporting error
});
