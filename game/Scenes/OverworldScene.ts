import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { Terrain } from '../World/Terrain';
import { Lighting } from '../Graphics/Lighting';
import { EntityManager } from '../Entities/EntityManager';
import { Player } from '../Entities/Player';
import { InputManager } from '../Systems/InputManager';
import { AssetLoader } from '../Systems/AssetLoader';
import { MovementSystem } from '../Systems/MovementSystem';
import { EventBus } from '../Core/EventBus';
import { World } from '../World/World';
import { SpawnManager } from '../World/SpawnManager';
import { InteractionSystem } from '../Systems/InteractionSystem';
import { SandboxWorld } from '../World/SandboxWorld';
import { MapManager } from '../World/MapManager';
import { DynamicWorldEventsSystem } from '../Systems/DynamicWorldEventsSystem';
import { SafeZoneSystem } from '../Systems/SafeZoneSystem';
import { ProceduralSpawnSystem } from '../Systems/Spawning/ProceduralSpawnSystem';
import { ProgressionManager } from '../Systems/Progression/ProgressionManager';
import { Game } from '../Core/Game';

/**
 * Overworld Scene.
 * Coordinates terrain, lighting, physics, and gameplay interactions.
 * Integrates World, MapManager, SpawnManager, and InteractionSystem.
 */
export class OverworldScene extends BaseScene {
  private terrain!: Terrain;
  private lighting!: Lighting;
  private entityManager!: EntityManager;
  private inputManager!: InputManager;
  private movementSystem!: MovementSystem;
  private eventBus: EventBus;

  // Real Playable Player character
  private player!: Player;

  // New modular world controllers
  private world!: World;
  private spawnManager!: SpawnManager;
  private interactionSystem!: InteractionSystem;
  private sandboxWorld: SandboxWorld;
  private mapManager!: MapManager;

  constructor(assetLoader: AssetLoader, inputManager: InputManager) {
    super(assetLoader);
    this.inputManager = inputManager;
    this.eventBus = EventBus.getInstance();
    this.sandboxWorld = new SandboxWorld();
  }

  /**
   * Initialize overworld coordinates, terrain meshes, and characters
   * @param mapData Optional map definition object for dynamic loading
   */
  public async init(mapData?: any): Promise<void> {
    if (this.isInitialized) return;
    
    // 1. Generate procedural 3D terrain
    this.terrain = new Terrain(this.scene, this.assetLoader);

    // Setup Lighting
    this.lighting = new Lighting(this.scene);

    // 2. Setup World manager (integrates SpatialHash and EntityManager)
    this.world = new World(this.scene);
    this.entityManager = this.world.entityManager; // Retain backward-compatible alias

    // 3. Setup Movement Boundary clipping
    this.movementSystem = new MovementSystem();

    // 4. Setup interaction triggers and action listener systems
    this.interactionSystem = new InteractionSystem(this.world);

    // 5. Setup decoupled spawns manager and spawn player hero
    this.spawnManager = new SpawnManager(this.world, this.assetLoader, this.inputManager);
    
    // Spawns and registers player
    const spawns = this.spawnManager.spawnAll();
    this.player = spawns.player;
    
    // 6. Setup MapManager and load starting map
    this.mapManager = new MapManager(
      this.world,
      this.terrain,
      this.lighting,
      this.assetLoader,
      this.inputManager
    );

    const initialMapId = typeof mapData === 'string' ? mapData : (mapData?.id || 'village');
    this.mapManager.loadMap(initialMapId);

    // Subscribe to map change events
    this.eventBus.on('map:change_request', this.handleMapChangeRequest);

    // 7. Initialize sandbox environment
    this.sandboxWorld.init(this.world, this.assetLoader);

    this.isInitialized = true;
    this.eventBus.emit('scene:ready', 'Overworld');
  }

  /**
   * Handles map transition request events
   */
  private handleMapChangeRequest = (data: { targetMapId: string; targetX?: number; targetZ?: number; targetName?: string }): void => {
    console.log(`[OverworldScene] Transitioning to map "${data.targetMapId}"...`);
    if (this.mapManager) {
      this.mapManager.changeMap(data.targetMapId, data.targetX, data.targetZ);
    }
  };

  /**
   * Run scene logic updates every frame tick
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // 1. Update world (this triggers animator updates, rebuilds the SpatialHash, and renders colliders)
    this.world.update(deltaTime);
    this.sandboxWorld.update(deltaTime, this.player);

    // 2. Update interaction detections (toggles prompt rings, tracks closest interactive prop)
    if (this.player && this.interactionSystem) {
      this.interactionSystem.update(this.player);
    }

    // 3. Enforce outer map boundaries on player (if not infinite procedural map)
    if (this.player && this.movementSystem) {
      this.movementSystem.update(
        this.player,
        this.mapManager?.currentMap?.type === 'procedural'
      );
    }

    // 4. Sync directional lights with the player coordinates to sustain visual atmosphere
    if (this.player && this.lighting) {
      this.lighting.update(this.player.position.x, this.player.position.z);
    }

    // 5. Sync noise & stealth state in DynamicWorldEventsSystem and position in SafeZoneSystem
    if (this.player) {
      SafeZoneSystem.getInstance().updatePlayerPosition(this.player.position.x, this.player.position.z);
      const isMoving = this.player.getPlayerState() === 'WALK';
      DynamicWorldEventsSystem.getInstance().setPlayerNoise(4.5, isMoving);
    }

    // 6. Update map atmospheric environment effects and procedural terrain streaming with camera frustum culling
    if (this.mapManager) {
      const activeCamera = Game.getInstance()?.rawCamera;
      this.mapManager.update(
        deltaTime,
        this.player ? this.player.position.x : 0,
        this.player ? this.player.position.z : 0,
        activeCamera || undefined
      );
    }

    // 7. Execute Procedural Enemy Spawning & AI State Machine tick
    if (this.player && this.world && this.assetLoader) {
      const currentMapId = this.mapManager?.currentMap?.id || 'village';
      const playerLevel = ProgressionManager.getInstance().getLevel();
      const isMoving = this.player.getPlayerState() === 'WALK';
      const playerNoise = isMoving ? 6.5 : 1.0;

      ProceduralSpawnSystem.getInstance().update(
        deltaTime,
        this.player.position,
        this.world,
        this.assetLoader,
        currentMapId,
        playerLevel,
        playerNoise
      );
    }
  }

  /**
   * Returns the player entity
   */
  public getPlayer(): Player {
    return this.player;
  }

  /**
   * Get the current camera look target (coordinates of the player)
   */
  public getFocalTarget(): THREE.Vector3 {
    return this.player ? this.player.position : new THREE.Vector3(0, 0, 0);
  }

  /**
   * Returns the World coordinator
   */
  public getWorld(): World {
    return this.world;
  }

  /**
   * Clean up overworld scene resources and event references
   */
  public destroy(): void {
    this.eventBus.off('map:change_request', this.handleMapChangeRequest);
    if (this.terrain) {
      this.terrain.destroy();
    }
    if (this.lighting) {
      this.lighting.destroy();
    }
    if (this.world) {
      this.world.destroy();
    }
    if (this.interactionSystem) {
      this.interactionSystem.destroy();
    }
    if (this.mapManager) {
      this.mapManager.destroy();
    }
    this.isInitialized = false;
  }
}
