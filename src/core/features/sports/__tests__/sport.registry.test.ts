import {
  getSport,
  getSportVariant,
  resolvePositionIds,
  UnsupportedSportError,
} from '../sport.registry';

describe('football sport definition', () => {
  it('exposes a default 11-player tackle variant', () => {
    const sport = getSport('football');
    const variant = getSportVariant('football');

    expect(sport?.defaultVariantId).toBe('tackle-11');
    expect(variant?.depthCharts.map(({ name }) => name)).toEqual([
      'Offense',
      'Defense',
      'Kick Off',
      'Kick Receiving',
      'Punt',
      'Punt Return',
      'Field Goal',
      'Field Goal Block',
    ]);
  });

  it('uses globally stable position ids', () => {
    const variant = getSportVariant('football', 'tackle-11');
    const ids = variant?.positions.map(({ id }) => id) ?? [];

    expect(ids).toContain('football.qb');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes the football special-team depth charts expected by the UI', () => {
    const variant = getSportVariant('football', 'tackle-11');
    const chartNames = variant?.depthCharts.map(({ name }) => name) ?? [];

    expect(chartNames).toContain('Punt');
    expect(chartNames).toContain('Kick Off');
    expect(chartNames).toContain('Kick Receiving');
    expect(chartNames).toContain('Field Goal');
    expect(chartNames).toContain('Field Goal Block');
  });

  it('gives every depth chart 11 positions', () => {
    const variant = getSportVariant('football', 'tackle-11');

    for (const chart of variant?.depthCharts ?? []) {
      expect(chart.positionIds).toHaveLength(11);
    }
  });

  it('resolves ids, labels, and abbreviations to canonical ids', () => {
    expect(resolvePositionIds('football', 'tackle-11', [
      'football.qb',
      'Wide Receiver',
      'LB',
    ])).toEqual([
      'football.qb',
      'football.wr',
      'football.lb',
    ]);
  });

  it('rejects positions outside the selected sport variant', () => {
    expect(() => resolvePositionIds(
      'football',
      'tackle-11',
      ['Goalkeeper'],
    )).toThrow(UnsupportedSportError);
  });
});
