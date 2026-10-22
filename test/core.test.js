import { test } from 'node:test';
import assert from 'node:assert/strict';

import { clamp, wrap, reflect, createRange, IntegerClampRangeError } from '../src/index.js';

const throwsRangeError = (fn) => {
  assert.throws(fn, (err) => {
    return err instanceof Error && err.name === 'IntegerClampRangeError';
  });
};

// --- clamp -------------------------------------------------------------

test('clamp returns values already inside the range unchanged', () => {
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(10, 0, 10), 10);
});

test('clamp saturates values below min', () => {
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(-100, 0, 10), 0);
});

test('clamp saturates values above max', () => {
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(1000, 0, 10), 10);
});

test('clamp works with negative ranges', () => {
  assert.equal(clamp(-5, -10, -1), -5);
  assert.equal(clamp(-20, -10, -1), -10);
  assert.equal(clamp(0, -10, -1), -1);
});

test('clamp on a width-1 range always returns that value', () => {
  assert.equal(clamp(0, 7, 7), 7);
  assert.equal(clamp(7, 7, 7), 7);
  assert.equal(clamp(-100, 7, 7), 7);
  assert.equal(clamp(100, 7, 7), 7);
});

test('clamp rejects non-integer inputs', () => {
  throwsRangeError(() => clamp(1.5, 0, 10));
  throwsRangeError(() => clamp(NaN, 0, 10));
  throwsRangeError(() => clamp('3', 0, 10));
});

test('clamp rejects min > max', () => {
  throwsRangeError(() => clamp(5, 10, 0));
});

// --- wrap --------------------------------------------------------------

test('wrap returns values already inside the range unchanged', () => {
  assert.equal(wrap(0, 0, 3), 0);
  assert.equal(wrap(2, 0, 3), 2);
  assert.equal(wrap(3, 0, 3), 3);
});

test('wrap wraps values above max back through min', () => {
  assert.equal(wrap(4, 0, 3), 0);
  assert.equal(wrap(5, 0, 3), 1);
  assert.equal(wrap(7, 0, 3), 3);
  assert.equal(wrap(8, 0, 3), 0);
});

test('wrap wraps values below min back through max', () => {
  assert.equal(wrap(-1, 0, 3), 3);
  assert.equal(wrap(-2, 0, 3), 2);
  assert.equal(wrap(-4, 0, 3), 0);
  assert.equal(wrap(-5, 0, 3), 3);
});

test('wrap on a width-1 range collapses every input to that value', () => {
  assert.equal(wrap(0, 7, 7), 7);
  assert.equal(wrap(7, 7, 7), 7);
  assert.equal(wrap(-100, 7, 7), 7);
  assert.equal(wrap(100, 7, 7), 7);
});

test('wrap works with a non-zero-based range', () => {
  // range [5, 8], width 4
  assert.equal(wrap(4, 5, 8), 8);
  assert.equal(wrap(9, 5, 8), 5);
  assert.equal(wrap(13, 5, 8), 5);
});

test('wrap rejects non-integer inputs', () => {
  throwsRangeError(() => wrap(2.5, 0, 3));
  throwsRangeError(() => wrap(0, 1.5, 3));
  throwsRangeError(() => wrap(0, 0, 3.5));
});

// --- reflect -----------------------------------------------------------

test('reflect returns values already inside the range unchanged', () => {
  assert.equal(reflect(0, 0, 3), 0);
  assert.equal(reflect(2, 0, 3), 2);
  assert.equal(reflect(3, 0, 3), 3);
});

test('reflect bounces values above max back inward', () => {
  assert.equal(reflect(4, 0, 3), 2);
  assert.equal(reflect(5, 0, 3), 1);
  assert.equal(reflect(6, 0, 3), 0);
  assert.equal(reflect(7, 0, 3), 1);  // double bounce
});

test('reflect bounces values below min back inward', () => {
  assert.equal(reflect(-1, 0, 3), 1);
  assert.equal(reflect(-2, 0, 3), 2);
  assert.equal(reflect(-3, 0, 3), 3);
  assert.equal(reflect(-4, 0, 3), 2);  // double bounce
});

test('reflect on a width-1 range collapses every input to that value', () => {
  assert.equal(reflect(0, 7, 7), 7);
  assert.equal(reflect(8, 7, 7), 7);
  assert.equal(reflect(-100, 7, 7), 7);
});

test('reflect works with a non-zero-based range', () => {
  // range [5, 8], width 3, period 6
  assert.equal(reflect(4, 5, 8), 6);   // bounced off 5
  assert.equal(reflect(9, 5, 8), 7);   // bounced off 8
  assert.equal(reflect(11, 5, 8), 5);  // double bounce off 8 then 5
});

test('reflect rejects non-integer inputs', () => {
  throwsRangeError(() => reflect(2.5, 0, 3));
  throwsRangeError(() => reflect(0, 1.5, 3));
  throwsRangeError(() => reflect(0, 0, 3.5));
});

// --- createRange -------------------------------------------------------

test('createRange returns an object with bound operations', () => {
  const r = createRange(0, 3);
  assert.equal(r.min, 0);
  assert.equal(r.max, 3);
  assert.equal(r.clamp(5), 3);
  assert.equal(r.wrap(4), 0);
  assert.equal(reflect(4, 0, 3), 2);
});

test('createRange rejects min > max at construction', () => {
  throwsRangeError(() => createRange(10, 0));
});

test('createRange rejects non-integer bounds at construction', () => {
  throwsRangeError(() => createRange(0.5, 3));
  throwsRangeError(() => createRange(0, 3.5));
});

test('createRange operations share one validated range', () => {
  const r = createRange(5, 7);
  assert.equal(r.clamp(4), 5);
  assert.equal(r.wrap(4), 7);
  assert.equal(r.reflect(4), 6);
});
