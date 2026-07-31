import { FantasySFX } from './FantasySFX';

export class GameFeelSystem {
  private static instance: GameFeelSystem;
  private isHitStopping: boolean = false;
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;

  public static getInstance(): GameFeelSystem {
    if (!GameFeelSystem.instance) {
      GameFeelSystem.instance = new GameFeelSystem();
    }
    return GameFeelSystem.instance;
  }

  public lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
  }

  /**
   * Triggers a brief freeze frame / hit stop (tactile impact delay)
   */
  public triggerHitStop(durationMs: number = 60, callback?: () => void): void {
    if (this.isHitStopping) return;
    this.isHitStopping = true;

    setTimeout(() => {
      this.isHitStopping = false;
      if (callback) callback();
    }, durationMs);
  }

  /**
   * Triggers screen shake for critical hits or shield breaks
   */
  public triggerScreenShake(intensity: number = 10, durationMs: number = 300): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = durationMs;

    // Dispatch DOM event for React UI screen shake animation if mounted
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gamefeel:screenshake', {
          detail: { intensity, durationMs },
        })
      );
    }
  }

  /**
   * Triggers visual impact feedback for Critical Hit
   */
  public onCriticalHit(): void {
    FantasySFX.getInstance().playSwordSlash();
    this.triggerScreenShake(12, 250);
    this.triggerHitStop(80);
  }

  /**
   * Triggers visual & sound feedback for Shield Rupture (Break)
   */
  public onShieldBreak(): void {
    FantasySFX.getInstance().playBreakShatter();
    this.triggerScreenShake(18, 400);
    this.triggerHitStop(120);
  }

  /**
   * Triggers feedback for BP Boost Activation
   */
  public onBoostActive(): void {
    FantasySFX.getInstance().playBoostCharge();
    this.triggerScreenShake(6, 150);
  }

  public isPausedForHitStop(): boolean {
    return this.isHitStopping;
  }
}

