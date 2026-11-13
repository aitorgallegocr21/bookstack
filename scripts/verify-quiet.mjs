#!/usr/bin/env node
/**
 * Quiet, token-optimized verification runner for AI agents and local workflows.
 * Automatically applies Prettier & ESLint auto-fixes first (0 LLM retry turns),
 * then executes each quality gate step and prints a single summary line per step
 * unless an error occurs.
 */
import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const isFast = process.argv.includes('--fast');
const skipAutoFix = process.argv.includes('--no-fix');

function runSilentAutoFix() {
  try {
    execSync('npx prettier --write . --log-level silent', { stdio: 'ignore' });
    execSync('npx eslint . --fix --quiet', { stdio: 'ignore' });
  } catch {
    // Subsequent verification steps will capture and report any remaining errors.
  }
}

const steps = [
  { name: 'check', cmd: 'npm run check --silent' },
  { name: 'lint', cmd: 'npx eslint . --quiet' },
  { name: 'format', cmd: 'npx prettier --check . --log-level warn' },
  { name: 'test', cmd: 'npx ng test --watch=false --no-progress' },
  ...(isFast
    ? []
    : [{ name: 'build', cmd: 'npx ng build --configuration production --no-progress' }]),
];

if (!skipAutoFix) {
  runSilentAutoFix();
}

const totalStart = performance.now();

for (const step of steps) {
  const start = performance.now();
  try {
    execSync(step.cmd, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    console.log(`[PASS] ${step.name} (${elapsed}s)`);
  } catch (err) {
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    console.error(`[FAIL] ${step.name} (${elapsed}s)`);
    if (err.stdout) process.stderr.write(err.stdout);
    if (err.stderr) process.stderr.write(err.stderr);
    process.exit(1);
  }
}

const totalElapsed = ((performance.now() - totalStart) / 1000).toFixed(1);
console.log(`✓ All ${steps.length} verification gates passed in ${totalElapsed}s.`);
