/**
 * Time Management System
 * Standardizes time delta calculation for frame-rate independent updates.
 */
export class Time {
  private lastTime: number = 0;
  private currentDelta: number = 0;
  private currentElapsed: number = 0;
  private isPausedState: boolean = false;

  constructor() {
    this.reset();
  }

  /**
   * Reset time counter
   */
  public reset(): void {
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.currentDelta = 0;
    this.currentElapsed = 0;
  }

  /**
   * Update time variables. Should be called once per frame at the start of the loop.
   * @returns The calculated delta time in seconds
   */
  public update(): number {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    
    if (this.isPausedState) {
      this.lastTime = now;
      this.currentDelta = 0;
      return 0;
    }

    // Convert milliseconds to seconds
    let delta = (now - this.lastTime) / 1000.0;

    // Cap delta to prevent massive jumps during tab suspension or lags
    if (delta > 0.1) {
      delta = 0.1;
    }

    this.currentDelta = delta;
    this.currentElapsed += delta;
    this.lastTime = now;

    return delta;
  }

  /**
   * Get Delta Time in seconds (time passed since last frame)
   */
  public get deltaTime(): number {
    return this.currentDelta;
  }

  /**
   * Get Total Elapsed Time in seconds since the game started
   */
  public get elapsed(): number {
    return this.currentElapsed;
  }

  /**
   * Pause the game time calculations
   */
  public pause(): void {
    this.isPausedState = true;
  }

  /**
   * Resume the game time calculations
   */
  public resume(): void {
    this.isPausedState = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  /**
   * Check if game time is paused
   */
  public get isPaused(): boolean {
    return this.isPausedState;
  }
}
