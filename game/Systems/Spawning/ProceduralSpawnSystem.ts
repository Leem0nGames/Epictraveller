import * as THREE from 'three';
import { World } from '../../World/World';
import { Enemy } from '../../Entities/Enemy';
import { AssetLoader } from '../AssetLoader';
import { SafeZoneSystem } from '../SafeZoneSystem';
import { ProceduralGenerator } from '../../World/ProceduralGenerator';
import { EventBus } from '../../Core/EventBus';

export interface ZoneDifficultyData {
  level: number;
  tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE';
  label: string;
  color: string;
  zoneTitle: string;
  hazardDescription: string;
}

export class ProceduralSpawnSystem {
  private static instance: ProceduralSpawnSystem;

  private activeEnemies: Map<string, Enemy> = new Map();
  private maxActiveMobs: number = 12;
  private minSpawnRadius: number = 18.0;
  private maxSpawnRadius: number = 46.0;
  private despawnRadius: number = 58.0;

  private spawnCooldownTimer: number = 0;
  private spawnInterval: number = 2.5; // Evaluate spawns every 2.5s
  private spawnCounter: number = 0;

  private constructor() {
    EventBus.getInstance().on('battle:ended', (data: { result: string; enemyId?: string }) => {
      if (data.result === 'VICTORY' && data.enemyId) {
        this.handleEnemyDefeated(data.enemyId);
      }
    });
  }

  public static getInstance(): ProceduralSpawnSystem {
    if (!ProceduralSpawnSystem.instance) {
      ProceduralSpawnSystem.instance = new ProceduralSpawnSystem();
    }
    return ProceduralSpawnSystem.instance;
  }

  /**
   * Evaluates zone difficulty rating dynamically based on world position (x, z), map ID, and biome hazard
   */
  public evaluateZoneDifficulty(x: number, z: number, mapId: string = 'village'): ZoneDifficultyData {
    if (SafeZoneSystem.getInstance().isSafeZone(mapId, x, z)) {
      return {
        level: 1,
        tier: 'LOW',
        label: 'Segura',
        color: '#10b981',
        zoneTitle: '🛡️ Santuario de Midgard-Loka (Zona Segura)',
        hazardDescription: 'Poblado protegido. Sin peligro de criaturas hostiles.',
      };
    }

    const distFromOrigin = Math.sqrt(x * x + z * z);
    const terrainSample = ProceduralGenerator.getInstance().sampleTerrain(x, z);
    
    let baseLevel = 1;
    let biomeModifier = 0;

    // Biome hazard rating bonus
    switch (terrainSample.biome) {
      case 'forest':
        biomeModifier = 2;
        break;
      case 'mountains':
        biomeModifier = 5;
        break;
      case 'desert':
      case 'valley':
        biomeModifier = 4;
        break;
      default:
        biomeModifier = 0;
        break;
    }

    // Distance difficulty scaling
    if (distFromOrigin < 22) {
      baseLevel = Math.floor(1 + distFromOrigin / 7);
      return {
        level: Math.min(4, baseLevel + biomeModifier),
        tier: 'LOW',
        label: 'Fácil',
        color: '#10b981',
        zoneTitle: '🌱 Bordes de la Villa (Nivel Bajo)',
        hazardDescription: 'Criaturas jóvenes y esbirros menores.',
      };
    } else if (distFromOrigin < 60) {
      baseLevel = Math.floor(4 + (distFromOrigin - 22) / 7);
      return {
        level: Math.min(10, baseLevel + biomeModifier),
        tier: 'MEDIUM',
        label: 'Medio',
        color: '#f59e0b',
        zoneTitle: '🌲 Bosques de Midgard (Nivel Medio)',
        hazardDescription: 'Bestias salvajes y patrullas de cazadores.',
      };
    } else if (distFromOrigin < 120) {
      baseLevel = Math.floor(11 + (distFromOrigin - 60) / 8);
      return {
        level: Math.min(18, baseLevel + biomeModifier),
        tier: 'HIGH',
        label: 'Difícil',
        color: '#f43f5e',
        zoneTitle: '🔥 Cañadas de Niflheim (Nivel Peligroso)',
        hazardDescription: 'Guardianes corruptos y vestigios de Vritra.',
      };
    } else {
      baseLevel = Math.floor(19 + (distFromOrigin - 120) / 10);
      return {
        level: Math.min(40, baseLevel + biomeModifier),
        tier: 'ELITE',
        label: 'Élite / Jefe',
        color: '#a855f7',
        zoneTitle: '☠️ Abismo Astral de Vritra (Peligro Extremo)',
        hazardDescription: 'Criaturas élite de nivel supremo.',
      };
    }
  }

  /**
   * Main game tick update that manages procedural mob population, despawns distant mobs, and triggers spawns
   */
  public update(
    deltaTime: number,
    playerPosition: THREE.Vector3,
    world: World,
    assetLoader: AssetLoader,
    mapId: string = 'village',
    playerLevel: number = 1,
    playerNoise: number = 0
  ): void {
    // 1. Update AI and position for active mobs, despawn those outside despawn radius
    this.activeEnemies.forEach((enemy, enemyId) => {
      const dist = enemy.position.distanceTo(playerPosition);

      if (dist > this.despawnRadius) {
        world.unregisterEntity(enemyId);
        enemy.destroy();
        this.activeEnemies.delete(enemyId);
      } else {
        // Pass player state down to Enemy AI
        enemy.update(deltaTime, playerPosition, playerNoise, playerLevel);
      }
    });

    // 2. Procedural Spawner Timer check
    this.spawnCooldownTimer += deltaTime;
    if (this.spawnCooldownTimer >= this.spawnInterval) {
      this.spawnCooldownTimer = 0;

      if (this.activeEnemies.size < this.maxActiveMobs) {
        this.attemptProceduralSpawn(playerPosition, world, assetLoader, mapId);
      }
    }
  }

  /**
   * Generates a procedural enemy mob at a valid location near the player outside Safe Zones
   */
  private attemptProceduralSpawn(
    playerPosition: THREE.Vector3,
    world: World,
    assetLoader: AssetLoader,
    mapId: string
  ): void {
    // Pick random polar coordinates in ring between minSpawnRadius and maxSpawnRadius
    const angle = Math.random() * Math.PI * 2;
    const distance = this.minSpawnRadius + Math.random() * (this.maxSpawnRadius - this.minSpawnRadius);
    
    const candidateX = playerPosition.x + Math.cos(angle) * distance;
    const candidateZ = playerPosition.z + Math.sin(angle) * distance;

    // Check if spawn location falls inside a Safe Zone
    if (SafeZoneSystem.getInstance().isSafeZone(mapId, candidateX, candidateZ)) {
      return;
    }

    // Sample terrain elevation & biome
    const terrainSample = ProceduralGenerator.getInstance().sampleTerrain(candidateX, candidateZ);
    
    // Do not spawn underwater
    if (terrainSample.height < 0.2) {
      return;
    }

    // Evaluate difficulty zone stats
    const diffData = this.evaluateZoneDifficulty(candidateX, candidateZ, mapId);
    this.spawnCounter++;

    const enemyId = `proc_mob_${Date.now()}_${this.spawnCounter}`;
    const mobProfile = this.selectMobProfileByTier(diffData.tier, diffData.level);

    const spawnPos = new THREE.Vector3(candidateX, terrainSample.height, candidateZ);
    const enemy = new Enemy(enemyId, mobProfile.classId, assetLoader, mobProfile.name, spawnPos);
    
    enemy.position.copy(spawnPos);
    enemy.setLevelAndStats(diffData.level, diffData.tier);
    enemy.lootTableId = mobProfile.lootTableId;

    world.registerEntity(enemy);
    this.activeEnemies.set(enemyId, enemy);
  }

  /**
   * Chooses appropriate mob archetype and names according to difficulty tier
   */
  private selectMobProfileByTier(
    tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE',
    level: number
  ): { classId: string; name: string; lootTableId: string } {
    if (tier === 'LOW') {
      const names = ['Limo Silvestre', 'Limo de Prana', 'Duende Explorador', 'Espíritu de Vritra'];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      return { classId: 'slime_enemy', name: chosenName, lootTableId: 'slime_loot_table' };
    } else if (tier === 'MEDIUM') {
      const isWolf = Math.random() < 0.5;
      if (isWolf) {
        return { classId: 'slime_enemy', name: 'Huargo Fenrir-Rakshasa', lootTableId: 'wolf_loot_table' };
      } else {
        return { classId: 'knight_armor', name: 'Guerrero Asura-Dvergr', lootTableId: 'orc_loot_table' };
      }
    } else if (tier === 'HIGH') {
      const names = ['Guardián Corrupto de Niflheim', 'Sombrío Devorador de Vritra', 'Caballero Sombra'];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      return { classId: 'knight_armor', name: chosenName, lootTableId: 'knight_loot_table' };
    } else {
      return {
        classId: 'knight_armor',
        name: `AVATAR DE VRITRA (Niv. ${level})`,
        lootTableId: 'boss_loot_table',
      };
    }
  }

  /**
   * Removes defeated mob from registry
   */
  private handleEnemyDefeated(enemyId: string): void {
    if (this.activeEnemies.has(enemyId)) {
      this.activeEnemies.delete(enemyId);
    }
  }

  /**
   * Resets active spawns pool
   */
  public clearAllSpawns(world?: World): void {
    this.activeEnemies.forEach((enemy, id) => {
      if (world) {
        world.unregisterEntity(id);
      }
      enemy.destroy();
    });
    this.activeEnemies.clear();
  }
}
