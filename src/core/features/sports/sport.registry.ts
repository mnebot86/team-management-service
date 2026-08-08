import { footballDefinition } from './definitions/football.definition';
import type {
  SportDefinition,
  SportPositionDefinition,
  SportVariantDefinition,
} from './sport.types';

const sports = [footballDefinition] as const satisfies readonly SportDefinition[];

export class UnsupportedSportError extends Error {}

export const getSports = (): readonly SportDefinition[] => sports;

export const getSport = (sportId: string): SportDefinition | undefined =>
  sports.find((sport) => sport.id === sportId);

export const getSportVariant = (
  sportId: string,
  variantId?: string,
): SportVariantDefinition | undefined => {
  const sport = getSport(sportId);
  const resolvedVariantId = variantId ?? sport?.defaultVariantId;

  return sport?.variants.find((variant) => variant.id === resolvedVariantId);
};

export const requireSportVariant = (
  sportId: string,
  variantId?: string,
): SportVariantDefinition => {
  const variant = getSportVariant(sportId, variantId);

  if (!variant) {
    throw new UnsupportedSportError(
      `Unsupported sport or variant: ${sportId}/${variantId ?? 'default'}`,
    );
  }

  return variant;
};

export const getPositionDefinition = (
  sportId: string,
  variantId: string | undefined,
  positionId: string,
): SportPositionDefinition | undefined =>
  getSportVariant(sportId, variantId)?.positions.find(
    (position) => position.id === positionId,
  );

export const resolvePositionIds = (
  sportId: string,
  variantId: string | undefined,
  values: string[],
): string[] => {
  const variant = requireSportVariant(sportId, variantId);
  const resolved = values.map((value) => {
    const normalizedValue = value.trim().toLowerCase();

    return variant.positions.find((position) =>
      position.id.toLowerCase() === normalizedValue
      || position.name.toLowerCase() === normalizedValue
      || position.shortName.toLowerCase() === normalizedValue,
    )?.id;
  });

  if (resolved.some((positionId) => !positionId)) {
    const invalidValues = values.filter((_value, index) => !resolved[index]);
    throw new UnsupportedSportError(
      `Unsupported positions for ${sportId}: ${invalidValues.join(', ')}`,
    );
  }

  return [...new Set(resolved as string[])];
};
