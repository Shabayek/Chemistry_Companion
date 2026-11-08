import { describe, it, expect } from 'vitest';
import { parseNumber, isNumericAnswerCorrect, formatAnswer } from '../src/game/engine/answers';

describe('parseNumber', () => {
  it.each([
    ['2', 2], ['-2', -2], ['+6', 6], ['1.5', 1.5], ['1,5', 1.5], ['.5', 0.5], ['3 L', 3], ['88.02 g', 88.02],
    ['6.02e23', 6.02e23], ['6.02E23', 6.02e23], ['6.02 × 10^23', 6.02e23], ['6.02x10^23', 6.02e23],
    ['6.02*10^23', 6.02e23], ['6.02·10²³', 6.02e23], ['1.2 × 10^-3', 1.2e-3], ['−0.76', -0.76],
  ])('%s -> %d', (input, expected) => {
    expect(parseNumber(input)).toBeCloseTo(expected, 10 - Math.max(0, Math.round(Math.log10(Math.abs(expected) || 1))));
  });
  it.each(['', 'abc', 'x', '--2'])('rejects %s', (input) => expect(parseNumber(input)).toBeNull());
});

describe('isNumericAnswerCorrect', () => {
  it('uses a 2% relative tolerance by default', () => {
    expect(isNumericAnswerCorrect('88', 88.02)).toBe(true);
    expect(isNumericAnswerCorrect('86', 88.02)).toBe(false);
    expect(isNumericAnswerCorrect('6e23', 6.022e23)).toBe(true);
  });
  it('supports custom and absolute tolerances', () => {
    expect(isNumericAnswerCorrect('0', 0)).toBe(true);
    expect(isNumericAnswerCorrect('0.4', 0, { abs: 0.5 })).toBe(true);
    expect(isNumericAnswerCorrect('1.08', 1.1, { rel: 0 , abs: 0.01 })).toBe(false);
  });
  it('rejects non-numbers', () => expect(isNumericAnswerCorrect('two', 2)).toBe(false));
});

describe('formatAnswer', () => {
  it('formats', () => {
    expect(formatAnswer(88.0152)).toBe('88.02');
    expect(formatAnswer(2)).toBe('2');
    expect(formatAnswer(6.02214076e23)).toBe('6.022 × 10^23');
    expect(formatAnswer(0)).toBe('0');
  });
});
