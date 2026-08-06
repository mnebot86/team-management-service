const ROLES = {
  COACH: 'coach',
  PLAYER: 'player',
  PARENT: 'parent',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export default ROLES;
