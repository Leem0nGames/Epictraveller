import * as THREE from 'three';
import { WorldObject } from '../Entities/WorldObject';
import { AssetLoader } from '../Systems/AssetLoader';
import { World } from './World';

export class WorldBuilder {
  public static buildSandbox(world: World, assetLoader: AssetLoader): void {
    // Helper to add objects
    const addObject = (type: string, x: number, z: number) => {
      const obj = new WorldObject(`obj_${type}_${x}_${z}`, type, assetLoader);
      obj.init();
      obj.position.set(x, 0, z);
      world.scene.add(obj.container);
      world.registerEntity(obj);
    };

    // Place some test objects
    addObject('TREE', -5, -5);
    addObject('TREE', 5, -5);
    addObject('ROCK', 2, 2);
    addObject('SIGN', -2, 2);
    addObject('CHEST', 0, 5);
  }
}
