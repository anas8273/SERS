/**
 * SERS Production Logger
 *
 * [PROD-MED-01] In production builds (NODE_ENV=production), all debug/info
 * logging is silenced to avoid noisy browser console output.
 * Errors are always logged in all environments.
 *
 * Usage (drop-in replacement for console):
 *   import { logger } from '@/lib/logger';
 *   logger.error('Critical failure:', err);   // Always logs
 *   logger.warn('Fallback used');              // Dev only
 *   logger.info('Cache hit');                  // Dev only
 *   logger.debug('Verbose data', obj);         // Dev only
 */

const IS_PROD = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (..._args: unknown[]) => {};

export const logger = {
  /** Always logs — use for genuine errors that indicate broken functionality */
  error: (...args: unknown[]) => console.error(...args),

  /** Dev only — use for recoverable issues, fallback paths */
  warn: IS_PROD ? noop : (...args: unknown[]) => console.warn(...args),

  /** Dev only — use for informational messages during development */
  info: IS_PROD ? noop : (...args: unknown[]) => console.info(...args),

  /** Dev only — use for verbose/debug data */
  debug: IS_PROD ? noop : (...args: unknown[]) => console.log(...args),

  /** Dev only — alias for console.log */
  log: IS_PROD ? noop : (...args: unknown[]) => console.log(...args),
};
