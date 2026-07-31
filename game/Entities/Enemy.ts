import * as THREE from 'three';
import { SpriteEntity } from './SpriteEntity';
import { AssetLoader } from '../Systems/AssetLoader';
import { SphereCollider } from '../Systems/CollisionSystem';
import { EventBus } from '../Core/EventBus';
import { SafeZoneSystem } from '../Systems/SafeZoneSystem';
import { InteractableTarget } from './InteractableTarget';
import { StatsComponent } from '../Systems/Stats/StatsComponent';
import { InteractionBloomPulse } from '../Effects/InteractionBloomPulse';
import { MobAIStateMachine, MobAIState } from '../Systems/AI/MobAIStateMachine';
import { ProceduralGenerator } from '../World/ProceduralGenerator';

/**
 * Reusable Hostile Enemy Entity with dynamic AI State Machine (Patrol, Alert, Chase, Fear, Return).
 * Integrates procedural difficulty level scaling, visual state badges, and real-time pathing.
 */
export class Enemy extends SpriteEntity implements InteractableTarget {
  public name: string;
  public interactionRadius: number = 2.0;
  public isNearPlayer: boolean = false;
  
  public stats: StatsComponent;
  public lootTableId: string = 'slime_loot_table';

  // Level & Difficulty Tiering
  public level: number = 1;
  public difficultyTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE' = 'LOW';
  public difficultyLabel: string = 'Fácil';
  public difficultyColor: string = '#10b981';
  public currentHp: number = 30;
  public maxHp: number = 30;

  // AI State Machine
  public aiStateMachine: MobAIStateMachine;
  private lastAIState: MobAIState = 'PATROL';

  // Floating Overhead Badge & Indicators
  private badgeSprite?: THREE.Sprite;
  private badgeCanvas?: HTMLCanvasElement;
  private badgeContext?: CanvasRenderingContext2D;
  private badgeTexture?: THREE.CanvasTexture;

  // Floating red action prompt & ground bloom pulse
  private promptMesh?: THREE.Mesh;
  private bloomPulse?: InteractionBloomPulse;
  private hoverTime: number = 0;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(id: string, classId: string, assetLoader: AssetLoader, name: string, initialPos?: THREE.Vector3) {
    super(id, classId, assetLoader);
    this.name = name;
    
    // Stats component setup
    this.stats = new StatsComponent();
    
    // Initialize AI State Machine at home spawn location
    const startVector = initialPos ? initialPos.clone() : new THREE.Vector3(0, 0, 0);
    this.aiStateMachine = new MobAIStateMachine(startVector);

    // Apply default level 1 stats
    this.setLevelAndStats(1, 'LOW');
  }

  /**
   * Dynamically configures Level and Stats based on Difficulty Tiering
   */
  public setLevelAndStats(level: number, tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE' = 'LOW'): void {
    this.level = Math.max(1, level);
    this.difficultyTier = tier;

    let tierMultiplier = 1.0;
    let colorHex = '#10b981'; // Green
    let label = 'Fácil';

    switch (tier) {
      case 'LOW':
        tierMultiplier = 1.0;
        colorHex = '#10b981'; // Green
        label = 'Fácil';
        break;
      case 'MEDIUM':
        tierMultiplier = 1.65;
        colorHex = '#f59e0b'; // Amber
        label = 'Medio';
        break;
      case 'HIGH':
        tierMultiplier = 2.8;
        colorHex = '#f43f5e'; // Rose
        label = 'Difícil';
        break;
      case 'ELITE':
        tierMultiplier = 4.8;
        colorHex = '#a855f7'; // Purple / Boss
        label = 'Élite';
        break;
    }

    this.difficultyLabel = label;
    this.difficultyColor = colorHex;

    // Stat formulas
    const calculatedMaxHp = Math.round((30 + level * 14) * tierMultiplier);
    const calculatedAttack = Math.round((5 + level * 3.5) * tierMultiplier);
    const calculatedDefense = Math.round((2 + level * 1.2) * tierMultiplier);

    this.maxHp = calculatedMaxHp;
    this.currentHp = calculatedMaxHp;

    this.stats.registerStat('maxHp', this.maxHp);
    this.stats.registerStat('attack', calculatedAttack);
    this.stats.registerStat('defense', calculatedDefense);
    this.stats.registerStat('maxMp', 20);

    // Update ground halo color to match difficulty tier
    if (this.bloomPulse) {
      const hexNum = parseInt(colorHex.replace('#', '0x'), 16);
      this.bloomPulse.setColor(hexNum);
    }

    this.updateOverheadBadge('🛡️', 'PATRULLA');
  }

  /**
   * Initialize assets and setup start animations
   */
  public init(): void {
    super.init();
    
    // Assign standard physical sphere collider
    this.collider = new SphereCollider(0.6, new THREE.Vector3(0, 0, 0));

    if (this.spriteAnimator) {
      this.spriteAnimator.setFPS(8);
      this.spriteAnimator.setAnimation('walk', true);
      this.spriteAnimator.setDirection('DOWN');
      this.spriteAnimator.reset();
    }

    // Build the aggressive red floating prompt indicator above its head
    this.buildInteractionPrompt();

    // Build overhead 2D canvas badge sprite
    this.buildOverheadBadgeSprite();

    // Build hostile bloom pulse ground halo matched to difficulty
    const hexNum = parseInt(this.difficultyColor.replace('#', '0x'), 16);
    this.bloomPulse = new InteractionBloomPulse(this.container, {
      colorHex: hexNum,
      radius: 0.95,
      lightHeight: 0.8,
    });
  }

  /**
   * Floating ring to denote interaction
   */
  private buildInteractionPrompt(): void {
    const ringGeo = new THREE.TorusGeometry(0.20, 0.04, 4, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.9,
    });

    this.promptMesh = new THREE.Mesh(ringGeo, ringMat);
    this.promptMesh.rotation.x = Math.PI / 2;
    this.promptMesh.position.set(0, 1.2, 0);
    this.promptMesh.visible = false;

    this.container.add(this.promptMesh);
    this.geometries.push(ringGeo);
    this.materials.push(ringMat);
  }

  /**
   * Constructs floating Overhead Sprite Badge canvas
   */
  private buildOverheadBadgeSprite(): void {
    this.badgeCanvas = document.createElement('canvas');
    this.badgeCanvas.width = 256;
    this.badgeCanvas.height = 80;
    this.badgeContext = this.badgeCanvas.getContext('2d') || undefined;

    this.badgeTexture = new THREE.CanvasTexture(this.badgeCanvas);
    this.badgeTexture.minFilter = THREE.LinearFilter;
    this.badgeTexture.magFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.badgeTexture,
      transparent: true,
      depthTest: false,
    });

    this.badgeSprite = new THREE.Sprite(spriteMat);
    this.badgeSprite.scale.set(1.8, 0.56, 1.0);
    this.badgeSprite.position.set(0, 1.85, 0);

    this.container.add(this.badgeSprite);
    this.materials.push(spriteMat);

    this.updateOverheadBadge('🛡️', 'PATRULLA');
  }

  /**
   * Draws and refreshes state & difficulty badge canvas texture
   */
  public updateOverheadBadge(icon: string, stateText: string): void {
    if (!this.badgeContext || !this.badgeCanvas || !this.badgeTexture) return;

    const ctx = this.badgeContext;
    const w = this.badgeCanvas.width;
    const h = this.badgeCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = this.difficultyColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 16);
    ctx.fill();
    ctx.stroke();

    // Icon + State Badge Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${icon} ${stateText}`, 20, 34);

    // Level & Difficulty Badge Text
    ctx.fillStyle = this.difficultyColor;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Niv.${this.level} [${this.difficultyLabel}]`, w - 20, 34);

    // HP Bar
    const barX = 20;
    const barY = 46;
    const barW = w - 40;
    const barH = 10;
    const hpRatio = Math.max(0, Math.min(1, this.currentHp / this.maxHp));

    // Bar background track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    // Bar fill
    ctx.fillStyle = hpRatio < 0.3 ? '#ef4444' : this.difficultyColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * hpRatio, barH, 4);
    ctx.fill();

    this.badgeTexture.needsUpdate = true;
  }

  /**
   * Proximity state handler
   */
  public setNearPlayer(near: boolean): void {
    if (this.isNearPlayer === near) return;
    this.isNearPlayer = near;

    if (this.promptMesh) {
      this.promptMesh.visible = near;
    }

    if (this.bloomPulse) {
      this.bloomPulse.setActive(near);
    }

    const isSafe = SafeZoneSystem.getInstance().isSafeZone();

    EventBus.getInstance().emit('interaction:proximity', {
      id: this.id,
      type: 'ENEMY',
      text: isSafe
        ? `🛡️ Zona Segura (${this.name} no ataca aquí)`
        : `Luchar contra ${this.name} [Niv.${this.level} - Estado: ${this.aiStateMachine.state}]`,
      near: near,
    });
  }

  /**
   * Action trigger E pressed near enemy initiates combat sequence
   */
  public onInteract(): void {
    if (!SafeZoneSystem.getInstance().canInitiateBattle()) {
      return;
    }

    EventBus.getInstance().emit('battle:start', {
      enemyId: this.id,
      enemyName: `${this.name} (Niv. ${this.level})`,
      enemyClassId: this.classId,
      enemyStats: this.stats,
      lootTableId: this.lootTableId,
    });
  }

  /**
   * Frame tick updates, executing AI state machine steering
   */
  public update(
    deltaTime: number,
    playerPosition?: THREE.Vector3,
    playerNoise: number = 0,
    playerLevel: number = 1
  ): void {
    if (!this.isActive) return;

    super.update(deltaTime);

    if (this.bloomPulse) {
      this.bloomPulse.update(deltaTime);
    }

    // Hovering prompt animation
    if (this.isNearPlayer && this.promptMesh) {
      this.hoverTime += deltaTime * 5;
      this.promptMesh.position.y = 1.2 + Math.sin(this.hoverTime) * 0.12;
      this.promptMesh.rotation.z += deltaTime * 2.0;
      const promptPulse = 1.0 + Math.sin(this.hoverTime * 1.5) * 0.12;
      this.promptMesh.scale.set(promptPulse, promptPulse, promptPulse);
    }

    // AI State Machine Execution
    if (playerPosition) {
      const aiResult = this.aiStateMachine.update(
        deltaTime,
        this.position,
        this.currentHp,
        this.maxHp,
        this.level,
        playerPosition,
        playerNoise,
        playerLevel
      );

      // Apply steering move step
      this.position.copy(aiResult.nextPosition);

      // Update terrain height coordinate Y
      const terrainHeight = ProceduralGenerator.getInstance().sampleTerrain(this.position.x, this.position.z).height;
      this.position.y = terrainHeight;

      // Update sprite orientation and animation state
      if (this.spriteAnimator) {
        this.spriteAnimator.setDirection(aiResult.direction);
        this.spriteAnimator.setAnimation(aiResult.animation, true);
      }

      // Update Overhead Badge when state shifts
      if (aiResult.state !== this.lastAIState) {
        this.lastAIState = aiResult.state;
        this.updateOverheadBadge(aiResult.badgeIcon, aiResult.badgeText);
      }
    }
  }

  /**
   * Clean up GL allocations
   */
  public destroy(): void {
    super.destroy();

    if (this.bloomPulse) {
      this.bloomPulse.destroy();
      this.bloomPulse = undefined;
    }

    if (this.badgeTexture) {
      this.badgeTexture.dispose();
    }

    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
  }
}
