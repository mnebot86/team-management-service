import type { SportDefinition, SportPositionDefinition } from '../sport.types';

const position = (
  id: string,
  name: string,
  shortName: string,
  group: string,
  sortOrder: number,
): SportPositionDefinition => ({
  id: `football.${id}`,
  name,
  shortName,
  group,
  sortOrder,
});

const positions = [
  position('qb', 'Quarterback', 'QB', 'Offense', 1),
  position('rb', 'Running Back', 'RB', 'Offense', 2),
  position('fb', 'Fullback', 'FB', 'Offense', 3),
  position('wr', 'Wide Receiver', 'WR', 'Offense', 4),
  position('te', 'Tight End', 'TE', 'Offense', 5),
  position('lt', 'Left Tackle', 'LT', 'Offense', 6),
  position('lg', 'Left Guard', 'LG', 'Offense', 7),
  position('c', 'Center', 'C', 'Offense', 8),
  position('rg', 'Right Guard', 'RG', 'Offense', 9),
  position('rt', 'Right Tackle', 'RT', 'Offense', 10),
  position('de', 'Defensive End', 'DE', 'Defense', 11),
  position('dt', 'Defensive Tackle', 'DT', 'Defense', 12),
  position('nt', 'Nose Tackle', 'NT', 'Defense', 13),
  position('lb', 'Linebacker', 'LB', 'Defense', 14),
  position('mlb', 'Middle Linebacker', 'MLB', 'Defense', 15),
  position('olb', 'Outside Linebacker', 'OLB', 'Defense', 16),
  position('cb', 'Cornerback', 'CB', 'Defense', 17),
  position('fs', 'Free Safety', 'FS', 'Defense', 18),
  position('ss', 'Strong Safety', 'SS', 'Defense', 19),
  position('k', 'Kicker', 'K', 'Special Teams', 20),
  position('p', 'Punter', 'P', 'Special Teams', 21),
  position('ls', 'Long Snapper', 'LS', 'Special Teams', 22),
  position('h', 'Holder', 'H', 'Special Teams', 23),
  position('kr', 'Kick Returner', 'KR', 'Special Teams', 24),
  position('pr', 'Punt Returner', 'PR', 'Special Teams', 25),
  position('lo', 'Left Outside', 'LO', 'Special Teams', 26),
  position('li', 'Left Inside', 'LI', 'Special Teams', 27),
  position('lm', 'Left Middle', 'LM', 'Special Teams', 28),
  position('lh', 'Left Hash', 'LH', 'Special Teams', 29),
  position('rh', 'Right Hash', 'RH', 'Special Teams', 30),
  position('rm', 'Right Middle', 'RM', 'Special Teams', 31),
  position('ri', 'Right Inside', 'RI', 'Special Teams', 32),
  position('ro', 'Right Outside', 'RO', 'Special Teams', 33),
  position('rs', 'Right Safety', 'RS', 'Special Teams', 34),
  position('ub', 'Up Back', 'UB', 'Special Teams', 35),
  position('lf', 'Left Front', 'LF', 'Special Teams', 36),
  position('rf', 'Right Front', 'RF', 'Special Teams', 37),
  position('lw', 'Left Wing', 'LW', 'Special Teams', 38),
  position('rw', 'Right Wing', 'RW', 'Special Teams', 39),
  position('sr', 'Safety / Deep Returner', 'SR', 'Special Teams', 40),
  position('pp', 'Personal Protector', 'PP', 'Special Teams', 41),
  position('lgun', 'Left Gunner', 'LGUN', 'Special Teams', 42),
  position('rgun', 'Right Gunner', 'RGUN', 'Special Teams', 43),
  position('lc', 'Left Corner', 'LC', 'Special Teams', 44),
  position('rc', 'Right Corner', 'RC', 'Special Teams', 45),
  position('le', 'Left Edge', 'LE', 'Special Teams', 46),
  position('re', 'Right Edge', 'RE', 'Special Teams', 47),
  position('m', 'Middle', 'M', 'Special Teams', 48),
  position('lhu', 'Left Hold-Up', 'LHU', 'Special Teams', 49),
  position('rhu', 'Right Hold-Up', 'RHU', 'Special Teams', 50),
  position('rsh', 'Rusher', 'RSH', 'Special Teams', 51),
  position('ds', 'Deep Safety', 'DS', 'Special Teams', 52),
  position('br', 'Block Returner', 'BR', 'Special Teams', 53),
];

const positionIdsForGroup = (group: string) => positions
  .filter((item) => item.group === group)
  .map((item) => item.id);

const buildChartPositions = (positionIds: string[]) => {
  const chartPositions = [...positionIds];

  while (chartPositions.length < 11) {
    const fallbackId = chartPositions[chartPositions.length - 1] ?? positionIds[0] ?? 'football.qb';
    chartPositions.push(fallbackId);
  }

  return chartPositions.slice(0, 11);
};

const offensePositions = buildChartPositions([
  'football.qb',
  'football.rb',
  'football.wr',
  'football.wr',
  'football.te',
  'football.lt',
  'football.lg',
  'football.c',
  'football.rg',
  'football.rt',
  'football.wr',
]);
const defensePositions = buildChartPositions([
  'football.de',
  'football.dt',
  'football.dt',
  'football.de',
  'football.lb',
  'football.mlb',
  'football.olb',
  'football.cb',
  'football.cb',
  'football.ss',
  'football.fs',
]);
const kickOffPositions = buildChartPositions([
  'football.k',
  'football.lo',
  'football.li',
  'football.lm',
  'football.lh',
  'football.rh',
  'football.rm',
  'football.ri',
  'football.ro',
  'football.ls',
  'football.rs',
]);
const kickReceivingPositions = buildChartPositions([
  'football.kr',
  'football.ub',
  'football.ub',
  'football.lf',
  'football.lm',
  'football.c',
  'football.rm',
  'football.rf',
  'football.lw',
  'football.rw',
  'football.sr',
]);
const puntPositions = buildChartPositions([
  'football.p',
  'football.ls',
  'football.lg',
  'football.rg',
  'football.lt',
  'football.rt',
  'football.lw',
  'football.rw',
  'football.pp',
  'football.lgun',
  'football.rgun',
]);
const puntReturnPositions = buildChartPositions([
  'football.pr',
  'football.lc',
  'football.rc',
  'football.le',
  'football.re',
  'football.li',
  'football.m',
  'football.ri',
  'football.lhu',
  'football.rhu',
  'football.rsh',
]);
const fieldGoalPositions = buildChartPositions([
  'football.k',
  'football.h',
  'football.ls',
  'football.le',
  'football.lt',
  'football.lg',
  'football.rg',
  'football.rt',
  'football.re',
  'football.lw',
  'football.rw',
]);
const fieldGoalBlockPositions = buildChartPositions([
  'football.le',
  'football.lt',
  'football.lg',
  'football.c',
  'football.rg',
  'football.rt',
  'football.re',
  'football.lo',
  'football.ro',
  'football.ds',
  'football.br',
]);

export const footballDefinition: SportDefinition = {
  id: 'football',
  name: 'Football',
  defaultVariantId: 'tackle-11',
  variants: [
    {
      id: 'tackle-11',
      name: '11-player tackle',
      positions,
      depthCharts: [
        {
          name: 'Offense',
          sortOrder: 1,
          positionIds: offensePositions,
        },
        {
          name: 'Defense',
          sortOrder: 2,
          positionIds: defensePositions,
        },
        {
          name: 'Kick Off',
          sortOrder: 3,
          positionIds: kickOffPositions,
        },
        {
          name: 'Kick Receiving',
          sortOrder: 4,
          positionIds: kickReceivingPositions,
        },
        {
          name: 'Punt',
          sortOrder: 5,
          positionIds: puntPositions,
        },
        {
          name: 'Punt Return',
          sortOrder: 6,
          positionIds: puntReturnPositions,
        },
        {
          name: 'Field Goal',
          sortOrder: 7,
          positionIds: fieldGoalPositions,
        },
        {
          name: 'Field Goal Block',
          sortOrder: 8,
          positionIds: fieldGoalBlockPositions,
        },
      ],
    },
  ],
};
