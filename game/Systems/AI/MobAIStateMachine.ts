import * as THREE from 'three';
import { SafeZoneSystem } from '../SafeZoneSystem';

export type MobAIState = 'IDLE' | 'PATROL' | 'ALERT' | 'CHASE' | 'FEAR' | 'RETURN';

export interface MobAIUpdateResult {
  nextPosition: THREE.Vector3;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  animation: 'idle' | 'walk';
  state: MobAIState;
  badgeIcon: string;
  badgeText: string;
  isMoving: boolean;
}

export class MobAIStateMachine {
  public state: MobAIState = 'PATROL';
  public homePosition: THREE.Vector3;
  public currentWaypoint: THREE.Vector3;
  
  // Detection and Tethering Configuration
  public detectionRadius: number = 9.0;
  public chaseRadius: number = 13.0;
  public leashDistance: number = 26.0;
  public patrolRadius: number = 6.5;

  private stateTimer: number = 0;
  private alertTimer: number = 0;
  private fleeTimer: number = 0;
  private idleDuration: number = 2.5;

  // Speeds (meters/sec)
  private patrolSpeed: number = 1.6;
  private chaseSpeed: number = 3.2;
  private fleeSpeed: number = 4.0;
  private returnSpeed: number = 2.4;

  constructor(homePosition: THREE.Vector3) {
    this.homePosition = homePosition.clone();
    this.currentWaypoint = this.getRandomPatrolPoint();
  }

  public setHomePosition(pos: THREE.Vector3): void {
    this.homePosition.copy(pos);
    this.currentWaypoint = this.getRandomPatrolPoint();
  }

  private getRandomPatrolPoint(): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.patrolRadius;
    return new THREE.Vector3(
      this.homePosition.x + Math.cos(angle) * dist,
      this.homePosition.y,
      this.homePosition.z + Math.sin(angle) * dist
    );
  }

  /**
   * Evaluates AI state transitions and computes steering & movement
   */
  public update(
    deltaTime: number,
    mobPosition: THREE.Vector3,
    mobHp: number,
    mobMaxHp: number,
    mobLevel: number,
    playerPosition: THREE.Vector3,
    playerNoise: number = 0,
    playerLevel: number = 1
  ): MobAIUpdateResult {
    this.stateTimer += deltaTime;
    const distToPlayer = mobPosition.distanceTo(playerPosition);
    const distToHome = mobPosition.distanceTo(this.homePosition);
    const hpRatio = mobMaxHp > 0 ? mobHp / mobMaxHp : 1.0;
    const isPlayerInSafeZone = SafeZoneSystem.getInstance().isSafeZone('village', playerPosition.x, playerPosition.z);

    // 1. STATE TRANSITION RULES
    
    // Rule A: Fear / Fleeing (Miedo)
    // Triggered when mob HP < 30% OR player level is > 6 levels higher & in close detection range
    const isIntimidatedByLevel = (playerLevel - mobLevel) >= 6 && distToPlayer < (this.detectionRadius * 0.7);
    const isSeverelyInjured = hpRatio < 0.30;

    if ((isSeverelyInjured || isIntimidatedByLevel) && distToPlayer < this.detectionRadius && !isPlayerInSafeZone) {
      if (this.state !== 'FEAR') {
        this.state = 'FEAR';
        this.fleeTimer = 0;
      }
    }

    // Rule B: Leash Break or Player enters Safe Zone -> Return
    if (distToHome > this.leashDistance || (isPlayerInSafeZone && this.state === 'CHASE')) {
      if (this.state !== 'RETURN' && this.state !== 'FEAR') {
        this.state = 'RETURN';
      }
    }

    // State Machine Handlers
    switch (this.state) {
      case 'IDLE': {
        if (this.stateTimer >= this.idleDuration) {
          this.state = 'PATROL';
          this.currentWaypoint = this.getRandomPatrolPoint();
          this.stateTimer = 0;
        }

        // Check detection
        if (!isPlayerInSafeZone) {
          if (distToPlayer <= this.detectionRadius || (distToPlayer <= this.detectionRadius * 1.4 && playerNoise > 5)) {
            this.state = 'ALERT';
            this.alertTimer = 0;
          }
        }
        break;
      }

      case 'PATROL': {
        const distToWaypoint = mobPosition.distanceTo(this.currentWaypoint);
        if (distToWaypoint < 0.6) {
          this.state = 'IDLE';
          this.idleDuration = 1.5 + Math.random() * 2.5;
          this.stateTimer = 0;
        }

        // Check detection
        if (!isPlayerInSafeZone) {
          if (distToPlayer <= this.detectionRadius || (distToPlayer <= this.detectionRadius * 1.4 && playerNoise > 5)) {
            this.state = 'ALERT';
            this.alertTimer = 0;
          }
        }
        break;
      }

      case 'ALERT': {
        this.alertTimer += deltaTime;
        // Turn towards player direction
        if (isPlayerInSafeZone || distToPlayer > this.chaseRadius) {
          this.state = 'PATROL';
          this.currentWaypoint = this.getRandomPatrolPoint();
        } else if (this.alertTimer >= 1.2 || distToPlayer < (this.detectionRadius * 0.65)) {
          this.state = 'CHASE';
        }
        break;
      }

      case 'CHASE': {
        if (isPlayerInSafeZone || distToPlayer > this.chaseRadius * 1.3) {
          this.state = 'RETURN';
        }
        break;
      }

      case 'FEAR': {
        this.fleeTimer += deltaTime;
        if (distToPlayer > (this.detectionRadius * 1.8) || this.fleeTimer > 6.0) {
          this.state = 'RETURN';
        }
        break;
      }

      case 'RETURN': {
        if (distToHome < 1.2) {
          this.state = 'IDLE';
          this.idleDuration = 2.0;
          this.stateTimer = 0;
        } else if (!isPlayerInSafeZone && distToPlayer < (this.detectionRadius * 0.5) && !isSeverelyInjured && !isIntimidatedByLevel) {
          this.state = 'CHASE';
        }
        break;
      }
    }

    // 2. MOVEMENT STEERING & POSITION UPDATE
    let targetPos = mobPosition.clone();
    let currentSpeed = 0;
    let isMoving = false;

    switch (this.state) {
      case 'IDLE':
      case 'ALERT':
        // No position change, face towards target direction
        targetPos = playerPosition.clone();
        break;

      case 'PATROL':
        targetPos = this.currentWaypoint.clone();
        currentSpeed = this.patrolSpeed;
        isMoving = true;
        break;

      case 'CHASE':
        targetPos = playerPosition.clone();
        currentSpeed = this.chaseSpeed;
        isMoving = true;
        break;

      case 'FEAR': {
        // Flee in opposite direction of player
        const fleeVector = mobPosition.clone().sub(playerPosition).normalize();
        targetPos = mobPosition.clone().add(fleeVector.multiplyScalar(6.0));
        currentSpeed = this.fleeSpeed;
        isMoving = true;
        break;
      }

      case 'RETURN':
        targetPos = this.homePosition.clone();
        currentSpeed = this.returnSpeed;
        isMoving = true;
        break;
    }

    // Calculate displacement
    const nextPosition = mobPosition.clone();
    let moveDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'DOWN';

    if (isMoving) {
      const dirVector = targetPos.clone().sub(mobPosition);
      dirVector.y = 0; // Maintain horizontal movement plane
      const length = dirVector.length();

      if (length > 0.01) {
        dirVector.normalize();
        
        // Determine 4-way direction for sprite renderer
        if (Math.abs(dirVector.x) > Math.abs(dirVector.z)) {
          moveDirection = dirVector.x > 0 ? 'RIGHT' : 'LEFT';
        } else {
          moveDirection = dirVector.z > 0 ? 'DOWN' : 'UP';
        }

        const moveStep = Math.min(length, currentSpeed * deltaTime);
        nextPosition.add(dirVector.multiplyScalar(moveStep));
      }
    } else {
      // Facing calculation when stationary
      const faceVector = targetPos.clone().sub(mobPosition);
      if (Math.abs(faceVector.x) > Math.abs(faceVector.z)) {
        moveDirection = faceVector.x > 0 ? 'RIGHT' : 'LEFT';
      } else {
        moveDirection = faceVector.z > 0 ? 'DOWN' : 'UP';
      }
    }

    // Select Badge Metadata
    let badgeIcon = '🛡️';
    let badgeText = 'PATRULLA';

    switch (this.state) {
      case 'IDLE':
        badgeIcon = '💤';
        badgeText = 'REPOSO';
        break;
      case 'PATROL':
        badgeIcon = '🛡️';
        badgeText = 'PATRULLA';
        break;
      case 'ALERT':
        badgeIcon = '❓';
        badgeText = '¡ALERTA!';
        break;
      case 'CHASE':
        badgeIcon = '❗';
        badgeText = '¡PERSECUCIÓN!';
        break;
      case 'FEAR':
        badgeIcon = '😱';
        badgeText = '¡MIEDO / HUYENDO!';
        break;
      case 'RETURN':
        badgeIcon = '↩️';
        badgeText = 'RETORNANDO';
        break;
    }

    return {
      nextPosition,
      direction: moveDirection,
      animation: isMoving ? 'walk' : 'idle',
      state: this.state,
      badgeIcon,
      badgeText,
      isMoving,
    };
  }
}
