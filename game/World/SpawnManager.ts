import * as THREE from 'three';
import { World } from './World';
import { Player } from '../Entities/Player';
import { CharacterEntity } from '../Entities/CharacterEntity';
import { NPC } from '../Entities/NPC';
import { Enemy } from '../Entities/Enemy';
import { WorldObject } from '../Entities/WorldObject';
import { Interactable } from '../Entities/Interactable';
import { SavePoint } from '../Entities/SavePoint';
import { AssetLoader } from '../Systems/AssetLoader';
import { InputManager } from '../Systems/InputManager';
import { Config } from '../Core/Config';
import { ProceduralSpawnSystem } from '../Systems/Spawning/ProceduralSpawnSystem';

/**
 * SpawnManager Class.
 * Handles the spawning and registration of the player, NPCs, static environmental props,
 * and chest/sign/savepoint interactables using values loaded dynamically from Config.ts.
 */
export class SpawnManager {
  private world: World;
  private assetLoader: AssetLoader;
  private inputManager: InputManager;

  constructor(world: World, assetLoader: AssetLoader, inputManager: InputManager) {
    this.world = world;
    this.assetLoader = assetLoader;
    this.inputManager = inputManager;
  }

  /**
   * Spawns all entities and registers them in the world
   */
  public spawnAll(): { player: Player } {
    // 1. Spawn and position the playable Player Hero
    const playerConf = Config.SPAWNS.PLAYER;
    const player = new Player(
      playerConf.id,
      'Hero',
      this.assetLoader,
      this.inputManager
    );
    player.position.set(playerConf.x, 0, playerConf.z);
    this.world.registerEntity(player);

    // 2. Spawn Static World Objects (Columns, Trees, Rocks)
    const objectsConf = Config.SPAWNS.OBJECTS;
    objectsConf.forEach((obj) => {
      const worldObj = new WorldObject(obj.id, obj.type, this.assetLoader);
      worldObj.position.set(obj.x, 0, obj.z);
      this.world.registerEntity(worldObj);
    });

    // 3. Spawn Interactable Objects (Chests, Signs, SavePoints)
    const interactablesConf = Config.SPAWNS.INTERACTABLES;
    interactablesConf.forEach((item) => {
      let interactable: Interactable;
      if (item.type === 'SAVE_POINT') {
        interactable = new SavePoint(item.id, this.assetLoader);
      } else {
        interactable = new Interactable(item.id, item.type, this.assetLoader);
      }
      interactable.position.set(item.x, 0, item.z);
      interactable.messageText = item.message;
      this.world.registerEntity(interactable);
    });

    // 4. Spawn Patrolling/Wandering NPCs and Enemies (Knight, Slimes, Enemy slimes)
    const npcsConf = Config.SPAWNS.NPCS;
    npcsConf.forEach((npc) => {
      if ('isEnemy' in npc && npc.isEnemy) {
        // Spawn as hostile Enemy
        const spawnPos = new THREE.Vector3(npc.x, 0, npc.z);
        const enemy = new Enemy(
          npc.id,
          npc.classId,
          this.assetLoader,
          npc.name || npc.id,
          spawnPos
        );
        enemy.position.copy(spawnPos);
        const diffData = ProceduralSpawnSystem.getInstance().evaluateZoneDifficulty(npc.x, npc.z, 'village');
        enemy.setLevelAndStats(diffData.level, diffData.tier);
        this.world.registerEntity(enemy);
      } else if ('dialogueId' in npc && npc.dialogueId) {
        // Spawn as dialogue-capable NPC entity
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
        // Spawn as standard patrolling CharacterEntity
        const charEntity = new CharacterEntity(npc.id, npc.classId, this.assetLoader);
        charEntity.position.set(npc.x, 0, npc.z);
        this.world.registerEntity(charEntity);
      }
    });

    return { player };
  }
}
