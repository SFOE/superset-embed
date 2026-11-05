/**
 * Blocks `npm install`. Only `npm ci` is allowed.
 * This script is referenced in package.json "preinstall".
 *
 * Rationale: `npm ci` installs EXACTLY the committed package-lock.json
 * (reproducible, audited). `npm install` can mutate the lockfile and pull
 * unexpected versions — a supply-chain risk. Forcing `npm ci` pins installs
 * to the reviewed lockfile.
 *
 * NOTE: `npm install --ignore-scripts` bypasses this guard (npm limitation).
 * That case is mitigated by:
 *   - CI workflows always using `npm ci --ignore-scripts`
 *   - package-lock.json being committed and verified by `npm ci`
 *   - the security CI workflow (audit-ci)
 */
const command = process.env.npm_command
if (!command || command === 'install') {
  console.error('\x1b[31m')
  console.error('ERROR: "npm install" is not allowed in this project.')
  console.error('Use "npm ci" to install dependencies from the lockfile.')
  console.error('\x1b[0m')
  process.exit(1)
}
