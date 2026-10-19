import { describe, expect, test } from 'vitest';
import { createDwellTimer } from './beacon';

function clock(start = 1000) {
  let t = start;
  return { now: () => t, set: (v: number) => (t = v), tick: (ms: number) => (t += ms) };
}

describe('createDwellTimer', () => {
  test('counts time while visible', () => {
    const c = clock();
    const timer = createDwellTimer(c.now);
    timer.visible();
    c.tick(1500);
    expect(timer.elapsed()).toBe(1500);
  });

  test('stops counting while hidden', () => {
    const c = clock();
    const timer = createDwellTimer(c.now);
    timer.visible();
    c.tick(1000);
    timer.hidden();
    c.tick(5000);
    expect(timer.elapsed()).toBe(1000);
  });

  test('resumes counting when visible again', () => {
    const c = clock();
    const timer = createDwellTimer(c.now);
    timer.visible();
    c.tick(1000);
    timer.hidden();
    c.tick(5000);
    timer.visible();
    c.tick(2000);
    expect(timer.elapsed()).toBe(3000);
  });

  test('reports zero before any visible period', () => {
    const c = clock();
    const timer = createDwellTimer(c.now);
    c.tick(4000);
    expect(timer.elapsed()).toBe(0);
  });

  test('never reports a negative elapsed time', () => {
    const c = clock(10_000);
    const timer = createDwellTimer(c.now);
    timer.visible();
    c.set(5000);
    expect(timer.elapsed()).toBe(0);
    timer.hidden();
    expect(timer.elapsed()).toBe(0);
  });
});
