/**
 * Core implementation of integer clamp, wrap, and reflect operations
 * over a bounded inclusive range [min, max].
 */

/**
 * Thrown when the range is invalid or an input is not an integer.
 *
 * Named RangeError locally but exported as IntegerClampRangeError to
 * avoid colliding with the global RangeError, which would be confusing
 * for callers catching by name.
 */
export class RangeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IntegerClampRangeError';
  }
}

/**
 * Returns true when x is a safe integer (per Number.isSafeInteger).
 *
 * Using Number.isSafeInteger rather than Number.isInteger is deliberate:
 * values beyond ±2^53 cannot be represented exactly as doubles, so
 * wrap arithmetic would silently lose precision. We refuse those inputs
 * rather than return plausible-looking nonsense.
 */
function assertInteger(x, label) {
  if (!Number.isSafeInteger(x)) {
    throw new RangeError(`${label} must be a safe integer; got ${String(x)}`);
  }
}

/**
 * Clamp x into the inclusive range [min, max].
 *
 * Behaviour outside [min, max]:
 *   - below min => min
 *   - above max => max
 *
 * No wrapping or reflection is applied — values stay at the boundary.
 */
export function clamp(x, min, max) {
  assertInteger(x, 'x');
  assertInteger(min, 'min');
  assertInteger(max, 'max');
  if (min > max) {
    throw new RangeError(`min (${min}) must be <= max (${max})`);
  }
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

/**
 * Wrap x into the inclusive range [min, max] using modular arithmetic.
 *
 * Treats the range as a ring of width (max - min + 1). A value that
 * falls off the top re-enters at the bottom, and vice versa.
 *
 * Behaviour:
 *   wrap(x, 0, 3): 0..3 -> identity, 4 -> 0, 5 -> 1, -1 -> 3, -2 -> 2.
 *
 * Edge case — range width of 1 (min === max):
 *   Every input maps to that single value. This is the only width where
 *   the modulo result is 0 for every x; we return min directly.
 */
export function wrap(x, min, max) {
  assertInteger(x, 'x');
  assertInteger(min, 'min');
  assertInteger(max, 'max');
  if (min > max) {
    throw new RangeError(`min (${min}) must be <= max (${max})`);
  }
  const width = max - min + 1;
  if (width === 1) {
    return min;
  }
  // JavaScript's % operator can return negative results for negative
  // dividends (e.g. -1 % 4 === -1). Adding width once and taking %
  // again normalises into [0, width).
  const offset = (x - min) % width;
  const normalised = offset < 0 ? offset + width : offset;
  return min + normalised;
}

/**
 * Reflect x into the inclusive range [min, max].
 *
 * Values beyond the range "bounce" off the boundary and travel back
 * inward, like a ball reflecting off a wall. Repeated application
 * always converges into [min, max] within a finite number of steps.
 *
 * Behaviour:
 *   reflect(0, 0, 3)   -> 0
 *   reflect(4, 0, 3)   -> 2   (bounced off the top, 3, back by 1)
 *   reflect(5, 0, 3)   -> 1
 *   reflect(-1, 0, 3)  -> 1   (bounced off the bottom, 0, back by 1)
 *   reflect(-2, 0, 3)  -> 2
 *
 * Edge case — range width of 1 (min === max):
 *   Reflection off a single point maps every input back to that point,
 *   so we return min directly.
 */
export function reflect(x, min, max) {
  assertInteger(x, 'x');
  assertInteger(min, 'min');
  assertInteger(max, 'max');
  if (min > max) {
    throw new RangeError(`min (${min}) must be <= max (${max})`);
  }
  if (x >= min && x <= max) {
    return x;
  }
  const width = max - min;
  if (width === 0) {
    return min;
  }
  const period = 2 * width;
  // Map x into a single period [min, min + period) using a non-negative
  // remainder. JavaScript's % preserves sign, so we normalise.
  let offset = ((x - min) % period);
  if (offset < 0) {
    offset += period;
  }
  if (offset <= width) {
    return min + offset;
  }
  return min + (period - offset);
}

/**
 * Bundles a fixed [min, max] range with bound-validated operations.
 *
 * Provided as a convenience: it avoids repeating min/max on every call
 * and validates the range once at construction rather than per call.
 */
export function createRange(min, max) {
  assertInteger(min, 'min');
  assertInteger(max, 'max');
  if (min > max) {
    throw new RangeError(`min (${min}) must be <= max (${max})`);
  }
  return {
    min,
    max,
    clamp: (x) => clamp(x, min, max),
    wrap: (x) => wrap(x, min, max),
    reflect: (x) => reflect(x, min, max),
  };
}
