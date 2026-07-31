import assetsData from '../../assets/manifest.json';

export interface SpriteScale {
  x: number;
  y: number;
}

export interface SpritePivot {
  x: number;
  y: number;
}

export interface SpriteAnimation {
  row: number;
  frames: number;
  loop: boolean;
}

export interface SpriteManifestEntry {
  id: string;
  name: string;
  url: string;
  author: string;
  license: string;
  repo: string;
  frameWidth: number;
  frameHeight: number;
  rows: number;
  columns: number;
  scale: SpriteScale;
  pivot: SpritePivot;
  animations: Record<string, SpriteAnimation>;
  directions: Record<string, number>;
  mirrorDirections?: Record<string, string>;
}

export interface AssetManifestSchema {
  sprites: SpriteManifestEntry[];
}

export const AssetManifest: AssetManifestSchema = assetsData as unknown as AssetManifestSchema;
