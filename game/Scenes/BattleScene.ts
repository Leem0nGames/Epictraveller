import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { AssetLoader } from '../Systems/AssetLoader';
import { CharacterEntity } from '../Entities/CharacterEntity';
import { EventBus } from '../Core/EventBus';

/**
 * Cinematic 3D Battle Scene.
 * Displays a dedicated circular battle arena with the player and the enemy facing each other.
 * Fully integrated with the game loop and Three.js rendering pipeline.
 */
export class BattleScene extends BaseScene {
  private ambientLight!: THREE.AmbientLight;
  private spotLights: THREE.SpotLight[] = [];
  
  // Battle characters (static sprites for cinematic effect)
  private battlePlayer!: CharacterEntity;
  private battleEnemy!: CharacterEntity;

  // Platform visual meshes
  private arenaPlatform!: THREE.Mesh;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  // Particle effects / combat animation timers
  private playerBasePos: THREE.Vector3 = new THREE.Vector3(-2.5, 0, 0);
  private enemyBasePos: THREE.Vector3 = new THREE.Vector3(2.5, 0, 0);

  constructor(assetLoader: AssetLoader) {
    super(assetLoader);
  }

  /**
   * Initialize battle stage, platform, spotlights, and combatants.
   */
  public async init(battleData?: { enemyClassId?: string }): Promise<void> {
    if (this.isInitialized) {
      this.destroy(); // Tear down previous battle state
    }

    const enemyClass = battleData?.enemyClassId || 'Slime';

    // Register EventBus listeners for 3D visual feedback
    const eventBus = EventBus.getInstance();
    eventBus.on('battle:animation', this.handleBattleAnimation);

    // 1. Setup dark mystical atmospheric lighting
    this.ambientLight = new THREE.AmbientLight(0x1a2130, 1.5);
    this.scene.add(this.ambientLight);

    // Spotlight 1: Bright golden spotlight on the Player
    const playerSpot = new THREE.SpotLight(0xffdf80, 15, 12, Math.PI / 6, 0.5, 1);
    playerSpot.position.set(-2.5, 6, 2);
    playerSpot.target.position.set(-2.5, 0, 0);
    this.scene.add(playerSpot);
    this.scene.add(playerSpot.target);
    this.spotLights.push(playerSpot);

    // Spotlight 2: Cyan/Red aggressive spotlight on the Enemy
    const enemySpotColor = enemyClass === 'Slime' ? 0x00ffff : 0xff3333;
    const enemySpot = new THREE.SpotLight(enemySpotColor, 15, 12, Math.PI / 6, 0.5, 1);
    enemySpot.position.set(2.5, 6, 2);
    enemySpot.target.position.set(2.5, 0, 0);
    this.scene.add(enemySpot);
    this.scene.add(enemySpot.target);
    this.spotLights.push(enemySpot);

    // 2. Setup central circular stone battle platform
    const platformGeo = new THREE.CylinderGeometry(4.5, 5.0, 0.4, 32);
    const platformMat = this.assetLoader.getMaterial('stone', {
      roughness: 0.9,
      metalness: 0.1,
    });
    
    this.arenaPlatform = new THREE.Mesh(platformGeo, platformMat);
    this.arenaPlatform.position.set(0, -0.2, 0);
    this.arenaPlatform.receiveShadow = true;
    this.scene.add(this.arenaPlatform);
    this.geometries.push(platformGeo);

    // 3. Spawn Battle Player character facing RIGHT
    this.battlePlayer = new CharacterEntity('battle_player_hero', 'Hero', this.assetLoader);
    this.battlePlayer.position.set(-2.5, 0, 0);
    this.battlePlayer.init();
    if (this.battlePlayer.animator) {
      this.battlePlayer.animator.setAnimation('walk', true);
      this.battlePlayer.animator.setDirection('RIGHT');
    }
    this.scene.add(this.battlePlayer.container);

    // 4. Spawn Battle Enemy character facing LEFT
    this.battleEnemy = new CharacterEntity('battle_enemy_slime', enemyClass, this.assetLoader);
    this.battleEnemy.position.set(2.5, 0, 0);
    this.battleEnemy.init();
    if (this.battleEnemy.animator) {
      this.battleEnemy.animator.setAnimation('walk', true);
      this.battleEnemy.animator.setDirection('LEFT');
    }
    this.scene.add(this.battleEnemy.container);

    // 5. Add atmospheric backdrop star dust / particles
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(particles);
    this.geometries.push(particleGeo);
    this.materials.push(particleMat);

    this.isInitialized = true;
    EventBus.getInstance().emit('scene:ready', 'Battle');
  }

  /**
   * Custom camera position override.
   * Returns a custom focus coordinate list so CameraController places the camera perfectly.
   */
  public getCameraFocus(): { position: THREE.Vector3; target: THREE.Vector3 } {
    return {
      position: new THREE.Vector3(0, 4, 11), // Cinematic high perspective looking down
      target: new THREE.Vector3(0, 0.8, 0),   // Focus in center of arena
    };
  }

  /**
   * Run visual frame updates (e.g. rotate platform slightly, tick sprite anims).
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Tick characters
    if (this.battlePlayer) this.battlePlayer.update(deltaTime);
    if (this.battleEnemy) this.battleEnemy.update(deltaTime);

    // Rotate the battle platform extremely slowly for dynamic parallax
    if (this.arenaPlatform) {
      this.arenaPlatform.rotation.y += deltaTime * 0.04;
    }
  }

  /**
   * Triggers 3D visual feedback when combat events occur
   */
  private handleBattleAnimation = (data: { type: string; [key: string]: any }): void => {
    if (!this.isInitialized) return;

    if (data.type === 'ATTACK' || data.type === 'SKILL') {
      // Step player forward towards enemy
      if (this.battlePlayer) {
        this.battlePlayer.position.set(-1.0, 0, 0);
        setTimeout(() => {
          if (this.battlePlayer) this.battlePlayer.position.copy(this.playerBasePos);
        }, 350);
      }
    } else if (data.type === 'ENEMY_ATTACK') {
      // Step enemy forward towards player
      if (this.battleEnemy) {
        this.battleEnemy.position.set(1.0, 0, 0);
        setTimeout(() => {
          if (this.battleEnemy) this.battleEnemy.position.copy(this.enemyBasePos);
        }, 350);
      }
    } else if (data.type === 'BREAK' || data.type === 'RESONANCE_CHAIN') {
      // Flash spotlights gold
      this.spotLights.forEach((light) => {
        const origColor = light.color.getHex();
        light.color.setHex(0xffd700);
        setTimeout(() => light.color.setHex(origColor), 400);
      });
    }
  };

  /**
   * Destroys the 3D meshes, lights, and sub-entities to prevent leaks.
   */
  public destroy(): void {
    this.isInitialized = false;

    EventBus.getInstance().off('battle:animation', this.handleBattleAnimation);

    if (this.battlePlayer) {
      this.battlePlayer.destroy();
    }
    if (this.battleEnemy) {
      this.battleEnemy.destroy();
    }

    if (this.ambientLight) {
      this.ambientLight.dispose();
    }
    this.spotLights.forEach((light) => {
      light.dispose();
      if (light.target) this.scene.remove(light.target);
    });
    this.spotLights = [];

    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];

    this.scene.clear();
  }
}
