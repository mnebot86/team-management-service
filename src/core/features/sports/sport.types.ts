export interface SportPositionDefinition {
  id: string;
  name: string;
  shortName: string;
  group: string;
  sortOrder: number;
}

export interface SportDepthChartTemplate {
  name: string;
  sortOrder: number;
  positionIds: string[];
  coordinates?: FormationCoordinates[];
}

export interface FormationCoordinates {
  x: number;
  y: number;
}

export interface SportFormationDefinition {
  id: string;
  name: string;
  positionIds: string[];
  coordinates?: FormationCoordinates[];
}

export interface SportVariantDefinition {
  id: string;
  name: string;
  positions: SportPositionDefinition[];
  depthCharts: SportDepthChartTemplate[];
  formations?: SportFormationDefinition[];
}

export interface SportDefinition {
  id: string;
  name: string;
  defaultVariantId: string;
  variants: SportVariantDefinition[];
}
