import { describe, expect, it } from 'vitest';
import { checkCommand, checkHotspot, checkOrdered, practiceOrder, starterDrills, validateDrill } from './lib';

describe('deterministic answer checks', () => {
  it('checks ordered steps exactly', () => {
    expect(checkOrdered(['one', 'two'], ['one', 'two'])).toBe(true);
    expect(checkOrdered(['one', 'two'], ['two', 'one'])).toBe(false);
  });

  it('honors command case settings without executing anything', () => {
    const drill = starterDrills[1];
    if (!drill || drill.kind !== 'command') throw new Error('fixture');
    expect(checkCommand(drill, 'mkdir field-notes')).toBe(true);
    expect(checkCommand(drill, 'MKDIR field-notes')).toBe(false);
    expect(checkCommand({ ...drill, caseSensitive: false }, 'MKDIR FIELD-NOTES')).toBe(true);
  });

  it('checks a circular hotspot boundary', () => {
    expect(checkHotspot({ x: 50, y: 50, radius: 10 }, 56, 58)).toBe(true);
    expect(checkHotspot({ x: 50, y: 50, radius: 10 }, 70, 50)).toBe(false);
  });
});

describe('portable drill files', () => {
  it('accepts a valid drill and rejects dangerous image content', () => {
    expect(validateDrill(starterDrills[0]).kind).toBe('ordered');
    expect(() => validateDrill({ ...starterDrills[2], image: 'data:image/svg+xml,<svg onload=alert(1)>' })).toThrow(/image/i);
  });

  it('creates a repeatable non-answer practice order', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(practiceOrder(items, 1)).toEqual(practiceOrder(items, 1));
    expect(practiceOrder(items, 1)).not.toEqual(items);
  });
});
