# integer-clamp-range-lib

Clamps, wraps, and reflects integer values into a bounded inclusive range, for modular coordinate systems, ring buffers, and tile-based game maps.

## Usage

```js
import { clamp, wrap, reflect, createRange } from 'integer-clamp-range-lib';

// Standalone functions take (x, min, max).
wrap(-1, 0, 3);          // 3  — re-enters at the top
reflect(5, 0, 3);        // 1  — bounces off the top, travels back inward
clamp(42, 0, 3);         // 3  — saturates at the top

// createRange bundles a fixed [min, max] with validated operations.
const grid = createRange(0, 15);
grid.wrap(16);           // 0
grid.reflect(17);       // 13
grid.clamp(99);          // 15
```

## Why this exists

Modular coordinate systems — toroidal grids, ring buffers, cyclic UI state — repeatedly need the same three operations over a bounded range. Each operation has a distinct semantics, and getting the boundary conditions right is fiddly: wrap-around at zero, double-reflection past both walls, single-value ranges where the modulo collapses. This library implements exactly those three operations, once, with the edge cases handled.

The trade-off: everything is restricted to integers bounded by `Number.isSafeInteger` (±2^53). Floating-point inputs are rejected rather than rounded, because silent rounding in modular arithmetic produces plausible-looking but wrong results. If you need sub-integer coordinates, this is the wrong library.

## Awkward edge

A range where `min === max` (width 1) is a degenerate but legal input. `clamp` always returns that value; `wrap` always returns that value (the modulo collapses to zero for every input); `reflect` always returns that value (a wall with no interior has nowhere to bounce). All three agree, which is the only consistent answer, but it means `wrap` and `reflect` are not invertible on width-1 ranges — you cannot recover the original input from the result.

## Exports

- `clamp(x, min, max)` — saturate to `[min, max]`.
- `wrap(x, min, max)` — modular wrap into `[min, max]`.
- `reflect(x, min, max)` — bounce off boundaries into `[min, max]`.
- `createRange(min, max)` — returns `{ min, max, clamp, wrap, reflect }`.
- `IntegerClampRangeError` — thrown on invalid input; the `name` property is `'IntegerClampRangeError'`.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

