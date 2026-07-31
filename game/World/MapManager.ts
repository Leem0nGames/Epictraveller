import * as THREE from 'three';
import { World } from './World';
import { Terrain } from './Terrain';
import { Lighting } from '../Graphics/Lighting';
import { AssetLoader } from '../Systems/AssetLoader';
import { InputManager } from '../Systems/InputManager';
import { Player } from '../Entities/Player';
import { WorldObject } from '../Entities/WorldObject';
import { Interactable } from '../Entities/Interactable';
import { SavePoint } from '../Entities/SavePoint';
import { NPC } from '../Entities/NPC';
import { Enemy } from '../Entities/Enemy';
import { CharacterEntity } from '../Entities/CharacterEntity';
import { Portal } from '../Entities/Portal';
import { MapTransitionManager } from './MapTransitionManager';
import { MAP_DEFINITIONS, MapDefinition } from './MapDefinitions';
import { EventBus } from '../Core/EventBus';
import { ExpeditionManager } from '../Systems/Expedition/ExpeditionManager';
import { DynamicWorldEventsSystem } from '../Systems/DynamicWorldEventsSystem';
import { MapEnvironmentEffects } from './MapEnvironmentEffects';
import { ProceduralSpawnSystem } from '../Systems/Spawning/ProceduralSpawnSystem';

export class MapManager {
  private world: World;
  private terrain: Terrain;
  private lighting: Lighting;
  private assetLoader: AssetLoader;
  private inputManager: InputManager;
  private currentMapId: string = 'village';
  private eventBus: EventBus;
  private transitionManager: MapTransitionManager;
  private environmentEffects: MapEnvironmentEffects;

  constructor(
    world: World,
    terrain: Terrain,
    lighting: Lighting,
    assetLoader: AssetLoader,
    inputManager: InputManager
  ) {
    this.world = world;
    this.terrain = terrain;
    this.lighting = lighting;
    this.assetLoader = assetLoader;
    this.inputManager = inputManager;
    this.eventBus = EventBus.getInstance();
    this.transitionManager = MapTransitionManager.getInstance();
    this.environmentEffects = new MapEnvironmentEffects(this.world.scene);
  }

  public get currentMap(): MapDefinition {
    return MAP_DEFINITIONS[this.currentMapId] || MAP_DEFINITIONS.village;
  }

  /**
   * Initiates a map transition with screen fade-out/fade-in and memory resource cleanup
   */
  public changeMap(mapId: string, spawnX?: number, spawnZ?: number): void {
    const mapDef = MAP_DEFINITIONS[mapId];
    if (!mapDef) {
      console.error(`MapManager: Unknown mapId "${mapId}"`);
      return;
    }

    this.transitionManager.transition(mapDef.name, () => {
      this.loadMap(mapId, spawnX, spawnZ);
    });
  }

  /**
   * Loads a map by ID, clearing non-player entities, rebuilding terrain & lighting,
   * spawning objects, and setting player position.
   */
  public loadMap(mapId: string, spawnX?: number, spawnZ?: number): void {
    const mapDef = MAP_DEFINITIONS[mapId];
    if (!mapDef) {
      console.error(`MapManager: Unknown mapId "${mapId}"`);
      return;
    }

    this.currentMapId = mapId;
    ExpeditionManager.getInstance().onMapEntered(mapId);
    DynamicWorldEventsSystem.getInstance().onMapEntered(mapId);

    // 1. Unregister & dispose all non-player entities to prevent memory leaks
    this.transitionManager.unloadWorldEntities(this.world);
    const allEntities = this.world.getAllEntities();

    // 2. Rebuild Terrain meshes for new map type
    this.terrain.loadMapTerrain(mapDef.type);

    // 3. Update Map Lighting & Atmospheric Particles
    this.lighting.setMapLighting(mapDef.lighting, mapDef.type);
    this.environmentEffects.setMapTheme(mapDef.type);

    // 4. Spawn Static Objects (Trees, Rocks, Columns, Walls, Torches, Fountains, Signs)
    mapDef.spawns.objects.forEach((obj) => {
      const worldObj = new WorldObject(obj.id, obj.type, this.assetLoader);
      worldObj.position.set(obj.x, 0, obj.z);
      this.world.registerEntity(worldObj);
    });

    // 5. Spawn Interactables (Chests, SavePoints)
    mapDef.spawns.interactables.forEach((item) => {
      let interactable: Interactable;
      if (item.type === 'SAVE_POINT') {
        interactable = new SavePoint(item.id, this.assetLoader);
      } else {
        interactable = new Interactable(item.id, item.type, this.assetLoader);
      }
      interactable.position.set(item.x, 0, item.z);
      if (item.message) {
        interactable.messageText = item.message;
      }
      this.world.registerEntity(interactable);
    });

    // 6. Spawn NPCs and Enemies
    mapDef.spawns.npcs.forEach((npc) => {
      if (npc.isEnemy) {
        const spawnPos = new THREE.Vector3(npc.x, 0, npc.z);
        const enemy = new Enemy(npc.id, npc.classId, this.assetLoader, npc.name || npc.id, spawnPos);
        enemy.position.copy(spawnPos);
        const diffData = ProceduralSpawnSystem.getInstance().evaluateZoneDifficulty(npc.x, npc.z, mapDef.id);
        enemy.setLevelAndStats(diffData.level, diffData.tier);
        this.world.registerEntity(enemy);
      } else if (npc.dialogueId) {
        const npcEntity = new NPC(
          npc.id,
          npc.classId,
          this.assetLoader,
          npc.name || npc.id,
          npc.dialogueId,
          'DOWN'
        );
        npcEntity.position.set(npc.x, 0, npc.z);
        this.world.registerEntity(npcEntity);
      } else {
        const charEntity = new CharacterEntity(npc.id, npc.classId, this.assetLoader);
        charEntity.position.set(npc.x, 0, npc.z);
        this.world.registerEntity(charEntity);
      }
    });

    // 7. Spawn Portals/Transition Doors
    mapDef.spawns.portals.forEach((portal) => {
      const portalEntity = new Portal(
        portal.id,
        this.assetLoader,
        portal.targetMapId,
        portal.targetX,
        portal.targetZ,
        portal.targetName,
        portal.prompt
      );
      portalEntity.position.set(portal.x, 0, portal.z);
      this.world.registerEntity(portalEntity);
    });

    // 8. Move Player to designated target spawn coordinates
    const playerEntity = allEntities.find((e) => e instanceof Player) as Player | undefined;
    if (playerEntity) {
      const targetX = spawnX !== undefined ? spawnX : mapDef.playerSpawn.x;
      const targetZ = spawnZ !== undefined ? spawnZ : mapDef.playerSpawn.z;
      const targetY = this.terrain.getTerrainHeight(targetX, targetZ);
      playerEntity.position.set(targetX, targetY, targetZ);
    }

    // 9. Notify HUD / UI systems of map change
    this.eventBus.emit('map:changed', {
      id: mapDef.id,
      name: mapDef.name,
      subtitle: mapDef.subtitle,
      type: mapDef.type,
    });

    console.log(`[MapManager] Loaded map: "${mapDef.name}" (${mapDef.id})`);
  }

  /**
   * Called on every game frame tick
   */
  public update(deltaTime: number, playerX: number = 0, playerZ: number = 0, camera?: THREE.Camera): void {
    this.terrain.update(playerX, playerZ, camera);
    if (this.environmentEffects) {
      this.environmentEffects.update(deltaTime);
    }
  }

  public destroy(): void {
    if (this.environmentEffects) {
      this.environmentEffects.destroy();
    }
  }
}
