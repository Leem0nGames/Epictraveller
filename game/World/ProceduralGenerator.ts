import * as THREE from 'three';
import { OpenSimplex2D, hashChunkCoords, PRNG } from '../Utils/Noise';
import { VillagePropType } from './VillageGeometryFactory';

export interface TerrainSample {
  height: number;
  biome: BiomeType;
  steepness: number;
  color: THREE.Color;
}

export type BiomeType = 'plains' | 'forest' | 'mountains' | 'desert' | 'valley';

export interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  propType: 'pine' | 'oak' | 'bush' | 'rock' | 'flower' | 'mushroom' | 'barrel' | 'crystal' | 'ruin';
}

export interface VillageScatterPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  villagePropType: VillagePropType;
}

export interface VillageCenter {
  x: number;
  z: number;
  radius: number;
  seed: number;
  type: 'city' | 'village' | 'hamlet' | 'outpost' | 'medieval' | 'desert';
}

export interface ChunkVisualVariation {
  chunkX: number;
  chunkZ: number;

  // Sub-biome name & description for exploration UI
  subBiomeTitle: string;
  subBiomeDescription: string;

  // Claudecraft terrain texture & normal map keys
  textureKey: string;      // Claudecraft texture key: 'grass' | 'dirt' | 'stone' | 'rock' | 'snow' | 'lava'
  normalKey: string;       // Claudecraft normal key: 'grass_normal' | 'dirt_normal' | 'stone_normal'
  textureRepeat: number;   // e.g. 4.5 to 8.5
  textureRotation: number; // 0, PI/2, PI, 3PI/2 (breaks repetitive tiling alignment)
  roughness: number;       // 0.70 to 0.95
  metalness: number;       // 0.0 to 0.20

  // Procedural Color Filter (applied to vertex colors and terrain material tint)
  colorFilter: THREE.Color;      // Base tint multiplier
  hueShift: number;              // -0.15 to +0.15
  saturationMultiplier: number;  // 0.65 to 1.35
  brightnessMultiplier: number;  // 0.80 to 1.20

  // Vegetation & Foliage Density Factors
  vegetationDensity: number;     // Multiplier on vegetation spawn probability (0.30 to 1.85)
  foliageScaleMultiplier: number;// Scale multiplier on trees/bushes/props (0.80 to 1.45)
  foliageColorTint: THREE.Color; // Foliage color modifier
  dominantFoliageProp?: ScatterPoint['propType']; // Preferred prop
}

export class ProceduralGenerator {
  private static defaultInstance: ProceduralGenerator | null = null;

  public static getInstance(seed: number | string = 1337): ProceduralGenerator {
    if (!ProceduralGenerator.defaultInstance) {
      ProceduralGenerator.defaultInstance = new ProceduralGenerator(seed);
    }
    return ProceduralGenerator.defaultInstance;
  }

  private noise: OpenSimplex2D;
  private biomeNoise: OpenSimplex2D;
  private detailNoise: OpenSimplex2D;
  private villageNoise: OpenSimplex2D;
  private seed: number;

  // Biome Color Palette
  private static readonly COLOR_GRASS = new THREE.Color(0x22c55e);  // Rich vibrant green
  private static readonly COLOR_FOREST = new THREE.Color(0x15803d); // Dark pine forest
  private static readonly COLOR_STONE = new THREE.Color(0x64748b);  // Mountain rock
  private static readonly COLOR_SNOW = new THREE.Color(0xf8fafc);   // Peak snow
  private static readonly COLOR_SAND = new THREE.Color(0xeab308);   // Sand desert
  private static readonly COLOR_DIRT = new THREE.Color(0x78350f);   // Valley dirt

  constructor(seed: number | string = 1337) {
    this.seed = typeof seed === 'number' ? seed : PRNG.hashString(seed);
    this.noise = new OpenSimplex2D(this.seed);
    this.biomeNoise = new OpenSimplex2D(this.seed + 101);
    this.detailNoise = new OpenSimplex2D(this.seed + 202);
    this.villageNoise = new OpenSimplex2D(this.seed + 303);
  }

  /**
   * Sample height and biome properties at global world position (x, z)
   * Uses fBm with 6 octaves for smooth mountain ranges and valleys
   */
  public sampleTerrain(x: number, z: number): TerrainSample {
    const scale = 0.015; // Primary terrain scale
    
    // 1. Continental noise (Macro features)
    const baseElevation = this.noise.fbm2D(x * scale * 0.5, z * scale * 0.5, 4, 0.5, 2.0); // [-1, 1]
    
    // 2. High detail mountain & hill ridge noise (Micro features)
    const ridgeNoise = Math.abs(this.noise.fbm2D(x * scale * 1.5, z * scale * 1.5, 6, 0.45, 2.1));
    const microDetail = this.detailNoise.fbm2D(x * 0.08, z * 0.08, 3, 0.5, 2.0) * 0.4;

    // Combine for final height elevation
    const heightFactor = Math.pow((baseElevation + 1) * 0.5, 1.8); // Curve elevation
    const height = heightFactor * 14.0 + ridgeNoise * 4.0 + microDetail - 3.0;

    // 3. Biome calculation
    const humidity = (this.biomeNoise.fbm2D(x * 0.008 + 100, z * 0.008 + 100, 3, 0.5, 2.0) + 1) * 0.5;
    const temp = (this.biomeNoise.fbm2D(x * 0.008 - 100, z * 0.008 - 100, 3, 0.5, 2.0) + 1) * 0.5;

    let biome: BiomeType = 'plains';
    let color = ProceduralGenerator.COLOR_GRASS.clone();

    if (height > 8.5) {
      biome = 'mountains';
      color = height > 11.0 ? ProceduralGenerator.COLOR_SNOW.clone() : ProceduralGenerator.COLOR_STONE.clone();
    } else if (temp > 0.7 && humidity < 0.35) {
      biome = 'desert';
      color = ProceduralGenerator.COLOR_SAND.clone();
    } else if (humidity > 0.6) {
      biome = 'forest';
      color = ProceduralGenerator.COLOR_FOREST.clone();
    } else if (height < -1.0) {
      biome = 'valley';
      color = ProceduralGenerator.COLOR_DIRT.clone();
    } else {
      // Gentle slope blend
      color.lerp(ProceduralGenerator.COLOR_DIRT, Math.max(0, (2.0 - height) * 0.2));
    }

    return {
      height,
      biome,
      steepness: 0, // Calculated during geometry normal generation
      color,
    };
  }

  /**
   * Evaluates macro-region multi-scale noise and chunk ID PRNG hash to generate a unique
   * visual variation profile per chunk (Claudecraft textures, color filters, vegetation density, sub-biome names).
   */
  public evaluateChunkVisualVariation(chunkX: number, chunkZ: number, chunkSize: number = 32.0): ChunkVisualVariation {
    const worldX = (chunkX + 0.5) * chunkSize;
    const worldZ = (chunkZ + 0.5) * chunkSize;
    const centerSample = this.sampleTerrain(worldX, worldZ);

    // 1. Micro Chunk PRNG Hash (deterministic per chunk coordinates)
    const chunkHash = hashChunkCoords(chunkX, chunkZ, this.seed + 888);
    const chunkPrng = new PRNG(chunkHash);

    // 2. Domain-warped macro region noise (Wavelength ~500m to 1000m) preventing repetition in far zones
    const warpX = this.detailNoise.fbm2D(worldX * 0.002, worldZ * 0.002, 3) * 80.0;
    const warpZ = this.detailNoise.fbm2D(worldX * 0.002 + 100, worldZ * 0.002 + 100, 3) * 80.0;
    const macroX = worldX + warpX;
    const macroZ = worldZ + warpZ;

    const macroNoise1 = (this.biomeNoise.fbm2D(macroX * 0.003, macroZ * 0.003, 4) + 1) * 0.5; // [0, 1]
    const macroNoise2 = (this.noise.fbm2D(macroX * 0.005 + 200, macroZ * 0.005 + 200, 3) + 1) * 0.5; // [0, 1]

    let subBiomeTitle = 'Praderas de Midgard';
    let subBiomeDescription = 'Terreno fértil con vegetación templada.';
    let textureKey = 'grass';
    let normalKey = 'grass_normal';
    let colorFilter = new THREE.Color(0xffffff);
    let vegetationDensity = 1.0;
    let foliageScaleMultiplier = 1.0;
    let foliageColorTint = new THREE.Color(0x15803d);
    let dominantFoliageProp: ScatterPoint['propType'] | undefined = undefined;

    // 3. Map base biome + macro region noise into 20 distinct sub-biome variants
    switch (centerSample.biome) {
      case 'plains':
        if (macroNoise1 < 0.28) {
          subBiomeTitle = '🌱 Praderas de Esmeralda Ancestral';
          subBiomeDescription = 'Campos frondosos rebosantes de vitalidad de Yggdrasil.';
          textureKey = 'grass';
          normalKey = 'grass_normal';
          colorFilter.setHex(0x22c55e);
          vegetationDensity = 1.15;
          foliageScaleMultiplier = 1.1;
          foliageColorTint.setHex(0x16a34a);
          dominantFoliageProp = 'oak';
        } else if (macroNoise1 < 0.55) {
          subBiomeTitle = '🌾 Estepa Dorada del Sol';
          subBiomeDescription = 'Llanuras secas bañadas por la luz del atardecer.';
          textureKey = 'dirt';
          normalKey = 'dirt_normal';
          colorFilter.setHex(0xeab308);
          vegetationDensity = 0.65;
          foliageScaleMultiplier = 0.95;
          foliageColorTint.setHex(0xca8a04);
          dominantFoliageProp = 'bush';
        } else if (macroNoise1 < 0.80) {
          subBiomeTitle = '🌸 Llano de Flores Silvestres';
          subBiomeDescription = 'Pradera multicolor cubierta de flores medicinales.';
          textureKey = 'grass';
          normalKey = 'grass_normal';
          colorFilter.setHex(0x34d399);
          vegetationDensity = 1.45;
          foliageScaleMultiplier = 1.05;
          foliageColorTint.setHex(0xf43f5e);
          dominantFoliageProp = 'flower';
        } else {
          subBiomeTitle = '🌬️ Páramo de Viento y Roca';
          subBiomeDescription = 'Planicie rocosa batida por vientos árticos.';
          textureKey = 'stone';
          normalKey = 'stone_normal';
          colorFilter.setHex(0x94a3b8);
          vegetationDensity = 0.45;
          foliageScaleMultiplier = 1.15;
          foliageColorTint.setHex(0x64748b);
          dominantFoliageProp = 'rock';
        }
        break;

      case 'forest':
        if (macroNoise1 < 0.30) {
          subBiomeTitle = '🌲 Soto de Pinos Azures';
          subBiomeDescription = 'Bosque frígido de pinos milenarios y agujas perennes.';
          textureKey = 'grass';
          normalKey = 'grass_normal';
          colorFilter.setHex(0x0d9488);
          vegetationDensity = 1.45;
          foliageScaleMultiplier = 1.25;
          foliageColorTint.setHex(0x0f766e);
          dominantFoliageProp = 'pine';
        } else if (macroNoise1 < 0.60) {
          subBiomeTitle = '🔮 Arboleda de Sombras Violeta';
          subBiomeDescription = 'Ecosistema místico impregnado de cristales bioluminiscentes.';
          textureKey = 'dirt';
          normalKey = 'dirt_normal';
          colorFilter.setHex(0x8b5cf6);
          vegetationDensity = 1.60;
          foliageScaleMultiplier = 1.20;
          foliageColorTint.setHex(0x7c3aed);
          dominantFoliageProp = 'crystal';
        } else if (macroNoise1 < 0.85) {
          subBiomeTitle = '🌳 Bosque Ancestral de Robles';
          subBiomeDescription = 'Espeso follaje robledo donde habitan espíritus guardianes.';
          textureKey = 'grass';
          normalKey = 'grass_normal';
          colorFilter.setHex(0x15803d);
          vegetationDensity = 1.75;
          foliageScaleMultiplier = 1.35;
          foliageColorTint.setHex(0x166534);
          dominantFoliageProp = 'oak';
        } else {
          subBiomeTitle = '🍄 Claro de Hongos Fluorescentes';
          subBiomeDescription = 'Humedal sombrío repleto de hongos esporádicos brillantes.';
          textureKey = 'dirt';
          normalKey = 'dirt_normal';
          colorFilter.setHex(0x06b6d4);
          vegetationDensity = 1.35;
          foliageScaleMultiplier = 1.0;
          foliageColorTint.setHex(0x0284c7);
          dominantFoliageProp = 'mushroom';
        }
        break;

      case 'mountains':
        if (macroNoise1 < 0.35) {
          subBiomeTitle = '⛰️ Cumbres Graníticas de Niflheim';
          subBiomeDescription = 'Formaciones rocosas abruptas y precipicios escarpados.';
          textureKey = 'rock';
          normalKey = 'stone_normal';
          colorFilter.setHex(0x64748b);
          vegetationDensity = 0.40;
          foliageScaleMultiplier = 1.30;
          foliageColorTint.setHex(0x475569);
          dominantFoliageProp = 'rock';
        } else if (macroNoise1 < 0.70) {
          subBiomeTitle = '❄️ Paso Helado de Yggdrasil';
          subBiomeDescription = 'Cumbres nevadas perpetuas donde el frío cala los huesos.';
          textureKey = 'snow';
          normalKey = 'stone_normal';
          colorFilter.setHex(0xf8fafc);
          vegetationDensity = 0.30;
          foliageScaleMultiplier = 1.10;
          foliageColorTint.setHex(0xe2e8f0);
          dominantFoliageProp = 'pine';
        } else {
          subBiomeTitle = '✨ Cresta de Cristales Abisales';
          subBiomeDescription = 'Picos volcánicos recubiertos de cuarzo y vetas de Prana.';
          textureKey = 'stone';
          normalKey = 'stone_normal';
          colorFilter.setHex(0xa855f7);
          vegetationDensity = 0.75;
          foliageScaleMultiplier = 1.25;
          foliageColorTint.setHex(0x9333ea);
          dominantFoliageProp = 'crystal';
        }
        break;

      case 'desert':
        if (macroNoise1 < 0.50) {
          subBiomeTitle = '🏜️ Dunas del Desierto de Samsara';
          subBiomeDescription = 'Inmensidad dorada abrasada por el sol sin sombra alguna.';
          textureKey = 'dirt';
          normalKey = 'dirt_normal';
          colorFilter.setHex(0xf59e0b);
          vegetationDensity = 0.35;
          foliageScaleMultiplier = 0.90;
          foliageColorTint.setHex(0xd97706);
          dominantFoliageProp = 'ruin';
        } else {
          subBiomeTitle = '🌴 Oasis de Palmeras y Verdor';
          subBiomeDescription = 'Santuario de agua en medio de la desolación árida.';
          textureKey = 'grass';
          normalKey = 'grass_normal';
          colorFilter.setHex(0x10b981);
          vegetationDensity = 1.25;
          foliageScaleMultiplier = 1.15;
          foliageColorTint.setHex(0x059669);
          dominantFoliageProp = 'flower';
        }
        break;

      case 'valley':
        if (macroNoise1 < 0.50) {
          subBiomeTitle = '🏜️ Valle de Cobre y Vestigios';
          subBiomeDescription = 'Tierra arcillosa rojiza jalonada de ruinas olvidadas.';
          textureKey = 'dirt';
          normalKey = 'dirt_normal';
          colorFilter.setHex(0xb45309);
          vegetationDensity = 0.55;
          foliageScaleMultiplier = 1.05;
          foliageColorTint.setHex(0x92400e);
          dominantFoliageProp = 'barrel';
        } else {
          subBiomeTitle = '☠️ Cañada Sombría de Vritra';
          subBiomeDescription = 'Barranco abisal sombrío donde se concentran los asuras.';
          textureKey = 'rock';
          normalKey = 'stone_normal';
          colorFilter.setHex(0x334155);
          vegetationDensity = 0.65;
          foliageScaleMultiplier = 1.20;
          foliageColorTint.setHex(0x1e293b);
          dominantFoliageProp = 'ruin';
        }
        break;
    }

    // 4. Micro Chunk PRNG variations to avoid tile alignment repeating
    const textureRepeat = 5.2 + chunkPrng.nextRange(-0.8, 1.6);
    const textureRotation = Math.floor(chunkPrng.next() * 4) * (Math.PI / 2);
    const roughness = Math.max(0.65, Math.min(0.98, 0.82 + chunkPrng.nextRange(-0.08, 0.08)));
    const metalness = Math.max(0, Math.min(0.20, 0.05 + chunkPrng.nextRange(0, 0.08)));
    const hueShift = chunkPrng.nextRange(-0.03, 0.03);
    const saturationMultiplier = chunkPrng.nextRange(0.90, 1.10);
    const brightnessMultiplier = chunkPrng.nextRange(0.92, 1.08);

    // Micro density wobble
    vegetationDensity *= chunkPrng.nextRange(0.85, 1.20);
    foliageScaleMultiplier *= chunkPrng.nextRange(0.92, 1.15);

    return {
      chunkX,
      chunkZ,
      subBiomeTitle,
      subBiomeDescription,
      textureKey,
      normalKey,
      textureRepeat,
      textureRotation,
      roughness,
      metalness,
      colorFilter,
      hueShift,
      saturationMultiplier,
      brightnessMultiplier,
      vegetationDensity,
      foliageScaleMultiplier,
      foliageColorTint,
      dominantFoliageProp,
    };
  }

  /**
   * Deterministic Object Scattering using Jittered Blue Noise Grid
   * O(N) per chunk without overlapping assets
   */
  public generateScatterPointsForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number,
    gridResolution: number = 4.0
  ): ScatterPoint[] {
    const scatterPoints: ScatterPoint[] = [];
    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;

    // Evaluate dynamic chunk visual & density variation
    const chunkVar = this.evaluateChunkVisualVariation(chunkX, chunkZ, chunkSize);

    const cols = Math.floor(chunkSize / gridResolution);
    const rows = Math.floor(chunkSize / gridResolution);

    // Calculate effective cell spawn occupancy threshold from chunk vegetation density
    const baseSpawnChance = 0.40;
    const effectiveOccupancyThreshold = Math.min(0.85, baseSpawnChance * chunkVar.vegetationDensity);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Deterministic cell seed
        const cellSeed = hashChunkCoords(chunkX * 100 + c, chunkZ * 100 + r, this.seed);
        const prng = new PRNG(cellSeed);

        // Chance to spawn an object in this cell according to chunk vegetation density
        const spawnChance = prng.next();
        if (spawnChance > effectiveOccupancyThreshold) continue;

        // Jittered position inside cell
        const worldX = minX + (c + prng.nextRange(0.15, 0.85)) * gridResolution;
        const worldZ = minZ + (r + prng.nextRange(0.15, 0.85)) * gridResolution;

        // Keep a clear spawn clearing around origin (0, 0)
        const distFromCenterSq = worldX * worldX + worldZ * worldZ;
        if (distFromCenterSq < 25.0) continue;

        // Suppress trees & rocks inside village settlement zone or on connected roads!
        if (this.isInsideVillageZone(worldX, worldZ) || this.isNearRoad(worldX, worldZ)) continue;

        const terrain = this.sampleTerrain(worldX, worldZ);

        let propType: ScatterPoint['propType'] = 'oak';
        let scale = prng.nextRange(0.85, 1.35) * chunkVar.foliageScaleMultiplier;

        // Dominant prop bias boost for current chunk variant
        if (chunkVar.dominantFoliageProp && prng.next() < 0.45) {
          propType = chunkVar.dominantFoliageProp;
        } else if (terrain.biome === 'forest') {
          const p = prng.next();
          if (p < 0.40) propType = 'pine';
          else if (p < 0.70) propType = 'oak';
          else if (p < 0.85) propType = 'bush';
          else propType = 'mushroom';
        } else if (terrain.biome === 'mountains') {
          const p = prng.next();
          if (p < 0.55) propType = 'rock';
          else if (p < 0.75) propType = 'ruin';
          else if (p < 0.90) propType = 'crystal';
          else propType = 'pine';
          scale *= 1.2;
        } else if (terrain.biome === 'desert') {
          const p = prng.next();
          if (p < 0.50) propType = 'rock';
          else if (p < 0.75) propType = 'barrel';
          else propType = 'ruin';
        } else if (terrain.biome === 'valley') {
          const p = prng.next();
          if (p < 0.40) propType = 'mushroom';
          else if (p < 0.70) propType = 'bush';
          else propType = 'flower';
        } else {
          // Plains
          const p = prng.next();
          if (p < 0.35) propType = 'oak';
          else if (p < 0.60) propType = 'bush';
          else if (p < 0.80) propType = 'flower';
          else if (p < 0.92) propType = 'rock';
          else propType = 'barrel';
        }

        scatterPoints.push({
          x: worldX,
          y: terrain.height,
          z: worldZ,
          scale,
          rotationY: prng.nextRange(0, Math.PI * 2),
          propType,
        });
      }
    }

    return scatterPoints;
  }

  /**
   * Deterministically finds village centers within a world region
   */
  public getVillageCentersInRegion(minX: number, minZ: number, maxX: number, maxZ: number): VillageCenter[] {
    const centers: VillageCenter[] = [];

    // Always include the Starting Walled City ("Eastbrook Vale") near spawn (35, 35)
    if (minX <= 120 && maxX >= -40 && minZ <= 120 && maxZ >= -40) {
      centers.push({
        x: 35.0,
        z: 35.0,
        radius: 44.0,
        seed: this.seed + 1,
        type: 'city',
      });
    }

    const regionSize = 90.0; // 90x90 meter region grid
    const minRx = Math.floor((minX - 60.0) / regionSize);
    const maxRx = Math.floor((maxX + 60.0) / regionSize);
    const minRz = Math.floor((minZ - 60.0) / regionSize);
    const maxRz = Math.floor((maxZ + 60.0) / regionSize);

    for (let rz = minRz; rz <= maxRz; rz++) {
      for (let rx = minRx; rx <= maxRx; rx++) {
        // Skip region (0,0) as starting city is placed at (35, 35)
        if (rx === 0 && rz === 0) continue;

        const regionSeed = hashChunkCoords(rx * 99, rz * 99, this.seed + 777);
        const prng = new PRNG(regionSeed);

        // 65% probability of a settlement in this region
        if (prng.next() > 0.65) continue;

        const cx = (rx + prng.nextRange(0.25, 0.75)) * regionSize;
        const cz = (rz + prng.nextRange(0.25, 0.75)) * regionSize;

        // Keep 60m separation from starting city center (35, 35)
        const dxS = cx - 35.0;
        const dzS = cz - 35.0;
        if (dxS * dxS + dzS * dzS < 3600.0) continue;

        const sample = this.sampleTerrain(cx, cz);
        if (sample.biome === 'mountains' || sample.height > 8.0 || sample.height < -1.0) continue;

        let type: VillageCenter['type'] = 'village';
        let radius = 30.0;

        const roll = prng.next();
        if (roll < 0.20) {
          type = 'city'; // Major Walled City!
          radius = prng.nextRange(42.0, 48.0);
        } else if (roll < 0.55) {
          type = sample.biome === 'desert' ? 'desert' : 'village'; // Medium Village
          radius = prng.nextRange(28.0, 36.0);
        } else if (roll < 0.82) {
          type = 'hamlet'; // Small Villa / Hamlet!
          radius = prng.nextRange(18.0, 24.0);
        } else {
          type = 'outpost'; // Fortified Outpost
          radius = prng.nextRange(14.0, 18.0);
        }

        centers.push({
          x: cx,
          z: cz,
          radius,
          seed: regionSeed,
          type,
        });
      }
    }

    return centers;
  }

  /**
   * Deterministically builds a connected road network graph connecting settlements to closest neighbors
   */
  public getRoadSegmentsForRegion(minX: number, minZ: number, maxX: number, maxZ: number): Array<[number, number, number, number]> {
    // Search a wide 250m border around chunk bounds to ensure complete road continuity
    const searchMinX = minX - 250.0;
    const searchMinZ = minZ - 250.0;
    const searchMaxX = maxX + 250.0;
    const searchMaxZ = maxZ + 250.0;

    const centers = this.getVillageCentersInRegion(searchMinX, searchMinZ, searchMaxX, searchMaxZ);
    const segments: Array<[number, number, number, number]> = [];
    const edgeSet = new Set<string>();

    // Always connect Spawn (0,0) -> Starting City (35, 35)
    segments.push([0.0, 0.0, 35.0, 35.0]);

    for (let i = 0; i < centers.length; i++) {
      const c1 = centers[i];
      const neighbors: Array<{ index: number; distSq: number }> = [];

      for (let j = 0; j < centers.length; j++) {
        if (i === j) continue;
        const c2 = centers[j];
        const dx = c2.x - c1.x;
        const dz = c2.z - c1.z;
        const distSq = dx * dx + dz * dz;

        // Connect if within 250m
        if (distSq <= 62500.0) {
          neighbors.push({ index: j, distSq });
        }
      }

      // Sort by distance and connect to 2 closest neighbors
      neighbors.sort((a, b) => a.distSq - b.distSq);
      const closest = neighbors.slice(0, 2);

      for (const n of closest) {
        const j = n.index;
        const c2 = centers[j];

        const k1 = `${Math.round(c1.x)},${Math.round(c1.z)}`;
        const k2 = `${Math.round(c2.x)},${Math.round(c2.z)}`;
        const key = k1 < k2 ? `${k1}_${k2}` : `${k2}_${k1}`;

        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          segments.push([c1.x, c1.z, c2.x, c2.z]);
        }
      }
    }

    return segments;
  }

  /**
   * Checks if world coordinates fall inside any village settlement area
   */
  public isInsideVillageZone(worldX: number, worldZ: number): boolean {
    const centers = this.getVillageCentersInRegion(worldX - 10, worldZ - 10, worldX + 10, worldZ + 10);
    return centers.some((c) => {
      const dx = worldX - c.x;
      const dz = worldZ - c.z;
      return dx * dx + dz * dz <= c.radius * c.radius;
    });
  }

  /**
   * Checks if world coordinates are within 3.0 meters of any road segment
   */
  public isNearRoad(worldX: number, worldZ: number): boolean {
    const segments = this.getRoadSegmentsForRegion(worldX - 15, worldZ - 15, worldX + 15, worldZ + 15);
    for (let i = 0; i < segments.length; i++) {
      const [x1, z1, x2, z2] = segments[i];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const lenSq = dx * dx + dz * dz;
      if (lenSq < 0.001) continue;

      let t = ((worldX - x1) * dx + (worldZ - z1) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = x1 + t * dx;
      const projZ = z1 + t * dz;
      const distSq = (worldX - projX) * (worldX - projX) + (worldZ - projZ) * (worldZ - projZ);

      if (distSq < 9.0) { // 3.0m clearance along roads
        return true;
      }
    }
    return false;
  }

  /**
   * Generates paved cobblestone roads and roadside streetlamps dynamically connecting towns
   */
  public generateRoadScatterForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number
  ): VillageScatterPoint[] {
    const points: VillageScatterPoint[] = [];

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;
    const maxX = minX + chunkSize;
    const maxZ = minZ + chunkSize;

    const roads = this.getRoadSegmentsForRegion(minX, minZ, maxX, maxZ);

    roads.forEach(([x1, z1, x2, z2]) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 1.0) return;

      const dirX = dx / len;
      const dirZ = dz / len;
      const perpX = -dirZ;
      const perpZ = dirX;

      const stepSize = 2.0;
      const numSteps = Math.floor(len / stepSize);

      for (let i = 0; i <= numSteps; i++) {
        const rx = x1 + dirX * (i * stepSize);
        const rz = z1 + dirZ * (i * stepSize);

        // Include road tiles inside chunk bounds
        if (rx >= minX && rx < maxX && rz >= minZ && rz < maxZ) {
          const terrain = this.sampleTerrain(rx, rz);
          // Main center road tile
          points.push({
            x: rx,
            y: terrain.height,
            z: rz,
            scale: 1.0,
            rotationY: Math.atan2(dirX, dirZ),
            villagePropType: 'v_cobblestone_tile',
          });

          // Parallel side road tile for wide double-lane road
          const rx2 = rx + perpX * 1.8;
          const rz2 = rz + perpZ * 1.8;
          points.push({
            x: rx2,
            y: terrain.height,
            z: rz2,
            scale: 1.0,
            rotationY: Math.atan2(dirX, dirZ),
            villagePropType: 'v_cobblestone_tile',
          });

          // Roadside streetlamp every 6 steps (~12m)
          if (i % 6 === 0) {
            const lx = rx + perpX * 3.2;
            const lz = rz + perpZ * 3.2;
            points.push({
              x: lx,
              y: terrain.height,
              z: lz,
              scale: 1.0,
              rotationY: 0,
              villagePropType: 'v_streetlamp',
            });
          }

          // Roadside cart / signpost / barrel every 14 steps
          if (i % 14 === 0 && i > 0) {
            const sx = rx - perpX * 3.2;
            const sz = rz - perpZ * 3.2;
            points.push({
              x: sx,
              y: terrain.height,
              z: sz,
              scale: 1.0,
              rotationY: Math.atan2(dirX, dirZ),
              villagePropType: 'v_cart',
            });
          }
        }
      }
    });

    return points;
  }

  /**
   * Generates procedural Village Settlements & Major Walled Cities
   * (Houses, Shops, Inn, Bank, Smithy, Perimeter Walls, Gates, Watchtowers, Small Hamlets, Fences, Benches)
   */
  public generateVillageScatterForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number
  ): VillageScatterPoint[] {
    const points: VillageScatterPoint[] = [];

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;
    const maxX = minX + chunkSize;
    const maxZ = minZ + chunkSize;

    // Find all village centers that could overlap this chunk
    const villageCenters = this.getVillageCentersInRegion(minX, minZ, maxX, maxZ);

    villageCenters.forEach((center) => {
      const vPrng = new PRNG(center.seed);

      const addPt = (
        wx: number,
        wz: number,
        type: VillagePropType,
        rotY: number = 0,
        scale: number = 1.0
      ) => {
        if (wx >= minX && wx < maxX && wz >= minZ && wz < maxZ) {
          const terrain = this.sampleTerrain(wx, wz);
          points.push({
            x: wx,
            y: terrain.height,
            z: wz,
            scale,
            rotationY: rotY,
            villagePropType: type,
          });
        }
      };

      // --- 1. MAJOR WALLED CITIES ('city' or 'medieval') ---
      if (center.type === 'city' || center.type === 'medieval') {
        // Central Plaza Monument
        addPt(center.x, center.z, 'v_statue', 0, 1.2);

        // Cobblestone Plaza Pavement (7x7 tile grid)
        for (let dx = -3; dx <= 3; dx++) {
          for (let dz = -3; dz <= 3; dz++) {
            if (dx === 0 && dz === 0) continue;
            addPt(center.x + dx * 2.4, center.z + dz * 2.4, 'v_cobblestone_tile', 0, 1.0);
          }
        }

        // Plaza Accents: Streetlamps, Noticeboard, Benches, Flowerbeds, Barrels, Chest
        addPt(center.x - 7.0, center.z - 7.0, 'v_streetlamp', 0, 1.0);
        addPt(center.x + 7.0, center.z - 7.0, 'v_streetlamp', 0, 1.0);
        addPt(center.x - 7.0, center.z + 7.0, 'v_streetlamp', 0, 1.0);
        addPt(center.x + 7.0, center.z + 7.0, 'v_streetlamp', 0, 1.0);

        addPt(center.x - 5.0, center.z + 5.0, 'v_noticeboard', Math.PI / 4, 1.0);
        addPt(center.x + 5.0, center.z - 5.0, 'v_bench', -Math.PI / 4, 1.0);
        addPt(center.x + 5.5, center.z + 5.0, 'v_chest', 0, 1.0);
        addPt(center.x - 5.5, center.z - 5.0, 'v_barrel_stack', 0, 1.0);
        addPt(center.x - 6.5, center.z - 4.5, 'v_crate_stack', 0, 1.0);
        addPt(center.x + 5.0, center.z + 7.5, 'v_flower_bed', 0, 1.0);

        // Radiating Avenues (N, S, E, W cobblestone streets to gates)
        const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        angles.forEach((ang) => {
          const dirX = Math.cos(ang);
          const dirZ = Math.sin(ang);
          const steps = Math.floor(center.radius / 2.4);

          for (let step = 3; step <= steps; step++) {
            const rx = center.x + dirX * (step * 2.4);
            const rz = center.z + dirZ * (step * 2.4);
            addPt(rx, rz, 'v_cobblestone_tile', ang, 1.0);

            if (step % 4 === 0) {
              const sideX = -dirZ * 2.4;
              const sideZ = dirX * 2.4;
              addPt(rx + sideX, rz + sideZ, 'v_streetlamp', 0, 1.0);
            }
          }
        });

        // City Districts & Buildings
        const houseLots = [
          // NE: Inn & Medium Houses
          { ox: 14, oz: 14, house: 'v_inn' as VillagePropType, rot: Math.PI },
          { ox: 25, oz: 12, house: 'v_house_medium' as VillagePropType, rot: Math.PI / 2 },
          { ox: 12, oz: 25, house: 'v_house_small' as VillagePropType, rot: 0 },

          // NW: Bank & Watchtower
          { ox: -14, oz: 14, house: 'v_bank' as VillagePropType, rot: Math.PI },
          { ox: -25, oz: 12, house: 'v_watchtower' as VillagePropType, rot: 0 },
          { ox: -12, oz: 25, house: 'v_house_small' as VillagePropType, rot: 0 },

          // SE: Smithy & Market
          { ox: 14, oz: -14, house: 'v_smithy' as VillagePropType, rot: 0 },
          { ox: 25, oz: -12, house: 'v_house_small' as VillagePropType, rot: -Math.PI / 2 },
          { ox: 12, oz: -25, house: 'v_house_medium' as VillagePropType, rot: Math.PI },

          // SW: Residential Houses
          { ox: -14, oz: -14, house: 'v_house_medium' as VillagePropType, rot: 0 },
          { ox: -25, oz: -12, house: 'v_house_small' as VillagePropType, rot: Math.PI / 2 },
          { ox: -12, oz: -25, house: 'v_watchtower' as VillagePropType, rot: Math.PI },
        ];

        houseLots.forEach((lot) => {
          const hx = center.x + lot.ox;
          const hz = center.z + lot.oz;
          addPt(hx, hz, lot.house, lot.rot, vPrng.nextRange(0.98, 1.02));

          const frontDirX = Math.sin(lot.rot);
          const frontDirZ = Math.cos(lot.rot);
          addPt(hx + frontDirX * 3.8, hz + frontDirZ * 3.8, 'v_bench', lot.rot, 1.0);
          addPt(hx + frontDirX * 3.5 - frontDirZ * 2.0, hz + frontDirZ * 3.5 + frontDirX * 2.0, 'v_barrel_stack', 0, 1.0);

          const fx = hx - frontDirX * 3.8;
          const fz = hz - frontDirZ * 3.8;
          addPt(fx - 2.8, fz, 'v_fence_straight', lot.rot, 1.0);
          addPt(fx + 2.8, fz, 'v_fence_straight', lot.rot, 1.0);
          addPt(fx, fz, 'v_fence_corner', lot.rot, 1.0);
        });

        // Market Wagons parked in plaza
        addPt(center.x + 8.5, center.z + 10.0, 'v_cart', Math.PI / 6, 1.0);
        addPt(center.x - 8.5, center.z + 10.0, 'v_cart', -Math.PI / 6, 1.0);

        // --- OUTER PERIMETER STONE WALL RING WITH BASTION TOWERS & GATES ---
        const wallRadius = center.radius;
        const totalWallSegments = 32;

        for (let k = 0; k < totalWallSegments; k++) {
          const theta = (k * Math.PI * 2) / totalWallSegments;
          const wx = center.x + Math.cos(theta) * wallRadius;
          const wz = center.z + Math.sin(theta) * wallRadius;
          const wallTangent = theta + Math.PI / 2;

          // Cardinal Gates where main avenues exit (k = 0, 8, 16, 24)
          if (k === 0 || k === 8 || k === 16 || k === 24) {
            addPt(wx, wz, 'v_wall_gate', wallTangent, 1.1);
          }
          // Diagonal Corner Bastion Towers (k = 4, 12, 20, 28)
          else if (k % 4 === 0) {
            addPt(wx, wz, 'v_wall_tower', 0, 1.0);
          }
          // Straight Wall Segments
          else {
            addPt(wx, wz, 'v_wall_straight', wallTangent, 1.0);
          }
        }
      }

      // --- 2. MEDIUM VILLAGE ('village' or 'desert') ---
      else if (center.type === 'village' || center.type === 'desert') {
        // Central Well & Plaza
        addPt(center.x, center.z, 'v_well', 0, 1.2);

        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (dx === 0 && dz === 0) continue;
            addPt(center.x + dx * 2.4, center.z + dz * 2.4, 'v_cobblestone_tile', 0, 1.0);
          }
        }

        addPt(center.x - 4.5, center.z - 4.5, 'v_streetlamp', 0, 1.0);
        addPt(center.x + 4.5, center.z + 4.5, 'v_streetlamp', 0, 1.0);
        addPt(center.x - 3.5, center.z + 3.5, 'v_noticeboard', Math.PI / 4, 1.0);
        addPt(center.x + 3.5, center.z - 3.5, 'v_bench', -Math.PI / 4, 1.0);

        // Houses
        const villageLots = [
          { ox: 12, oz: 10, house: 'v_smithy' as VillagePropType, rot: Math.PI / 2 },
          { ox: -12, oz: 10, house: 'v_house_medium' as VillagePropType, rot: -Math.PI / 2 },
          { ox: 10, oz: -12, house: 'v_house_small' as VillagePropType, rot: 0 },
          { ox: -10, oz: -12, house: 'v_house_small' as VillagePropType, rot: Math.PI },
        ];

        villageLots.forEach((lot) => {
          addPt(center.x + lot.ox, center.z + lot.oz, lot.house, lot.rot, 1.0);
        });

        // Outer Wooden Fence Stockade Boundary
        const fenceRadius = center.radius;
        const totalFenceSegs = 20;

        for (let k = 0; k < totalFenceSegs; k++) {
          // Leave gap openings at cardinal road exits
          if (k === 0 || k === 5 || k === 10 || k === 15) {
            const theta = (k * Math.PI * 2) / totalFenceSegs;
            const wx = center.x + Math.cos(theta) * fenceRadius;
            const wz = center.z + Math.sin(theta) * fenceRadius;
            addPt(wx, wz, 'v_city_arch', theta + Math.PI / 2, 0.9);
            continue;
          }

          const theta = (k * Math.PI * 2) / totalFenceSegs;
          const wx = center.x + Math.cos(theta) * fenceRadius;
          const wz = center.z + Math.sin(theta) * fenceRadius;
          addPt(wx, wz, 'v_fence_straight', theta + Math.PI / 2, 1.0);
        }
      }

      // --- 3. SMALL VILLAGE / HAMLET ('hamlet') - "Villas Pequeñas" ---
      else if (center.type === 'hamlet') {
        // Central Bonfire / Well
        addPt(center.x, center.z, 'v_bonfire', 0, 1.2);
        addPt(center.x - 3.2, center.z, 'v_bench', Math.PI / 2, 1.0);
        addPt(center.x + 3.2, center.z, 'v_bench', -Math.PI / 2, 1.0);
        addPt(center.x, center.z + 3.5, 'v_flower_bed', 0, 1.0);
        addPt(center.x - 3.0, center.z - 3.0, 'v_streetlamp', 0, 1.0);

        // 4 Cozy Small Cottages arranged in a circle
        const cottageAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
        cottageAngles.forEach((ang, idx) => {
          const dist = 12.0;
          const hx = center.x + Math.cos(ang) * dist;
          const hz = center.z + Math.sin(ang) * dist;
          const facingCenter = ang + Math.PI;

          addPt(hx, hz, 'v_house_small', facingCenter, vPrng.nextRange(0.95, 1.05));

          // Small vegetable garden behind cottage
          const backX = hx - Math.cos(ang) * 3.5;
          const backZ = hz - Math.sin(ang) * 3.5;
          addPt(backX, backZ, 'v_fence_straight', facingCenter, 0.9);
        });

        // Farm accessories
        addPt(center.x + 6.0, center.z - 6.0, 'v_cart', 0.4, 1.0);
        addPt(center.x - 6.0, center.z + 6.0, 'v_barrel_stack', 0, 1.0);
        addPt(center.x + 5.0, center.z + 6.0, 'v_noticeboard', -0.5, 1.0);
      }

      // --- 4. FORTIFIED OUTPOST ('outpost') ---
      else {
        // Central Watchtower
        addPt(center.x, center.z, 'v_watchtower', 0, 1.1);

        // Bonfire & Crates
        addPt(center.x + 4.0, center.z + 2.0, 'v_bonfire', 0, 1.0);
        addPt(center.x + 4.0, center.z - 2.0, 'v_crate_stack', 0, 1.0);
        addPt(center.x - 4.0, center.z + 2.0, 'v_noticeboard', 0, 1.0);
        addPt(center.x - 4.0, center.z - 2.0, 'v_streetlamp', 0, 1.0);

        // Outer Stockade Fence Arc
        const fenceRadius = center.radius;
        for (let k = 0; k < 10; k++) {
          const theta = (k * Math.PI) / 6;
          const wx = center.x + Math.cos(theta) * fenceRadius;
          const wz = center.z + Math.sin(theta) * fenceRadius;
          addPt(wx, wz, 'v_fence_straight', theta + Math.PI / 2, 1.0);
        }
      }
    });

    return points;
  }
}
