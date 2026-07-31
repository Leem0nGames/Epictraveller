import * as THREE from 'three';
import { WorldBuilder } from './WorldBuilder';
import { ParticleSystem } from '../Effects/ParticleSystem';
import { CameraEffects } from '../Systems/CameraEffects';
import { AssetLoader } from '../Systems/AssetLoader';
import { FootstepSystem } from '../Systems/FootstepSystem';
import { Player } from '../Entities/Player';
import { World } from './World';

export class SandboxWorld {
  public particleSystem: ParticleSystem;
  public cameraEffects: CameraEffects;
  public footstepSystem: FootstepSystem;

  constructor() {
    this.particleSystem = new ParticleSystem();
    this.cameraEffects = new CameraEffects({ lag: 0.1, zoom: 1 });
    this.footstepSystem = new FootstepSystem(this.particleSystem);
  }

  public init(world: World, assetLoader: AssetLoader): void {
    WorldBuilder.buildSandbox(world, assetLoader);
  }

  public update(dt: number, player?: Player): void {
    this.particleSystem.update(dt);
    this.cameraEffects.update(dt);
    
    if (player) {
        this.footstepSystem.update(player.getPlayerState() === 'WALK', player.position.x, player.position.z);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Canvas-based particles. If they were THREE.js objects, we'd add to scene
    this.particleSystem.render(ctx);
  }
}
