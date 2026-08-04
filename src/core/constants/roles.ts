const ROLES = {
  OWNER: 'owner',
  COACH: 'coach',
  PLAYER: 'player',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export default ROLES;
