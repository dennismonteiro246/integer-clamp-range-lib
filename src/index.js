/**
 * integer-clamp-range-lib
 *
 * Public API surface. All exports are re-exported from core.js so that
 * there is a single place to maintain behaviour.
 */

export { createRange } from './core.js';
export { clamp, wrap, reflect } from './core.js';
export { RangeError as IntegerClampRangeError } from './core.js';
