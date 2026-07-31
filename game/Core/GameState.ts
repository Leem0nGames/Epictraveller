export type GameStateType = 
  | 'MainMenu'
  | 'Overworld'
  | 'Combat'
  | 'Paused'
  | 'GameOver'
  | string;

export interface GameStateData {
  [key: string]: any;
}

export interface IGameState {
  /**
   * Unique state identifier
   */
  readonly name: GameStateType;

  /**
   * Called when entering the state.
   */
  enter(data?: GameStateData): void | Promise<void>;

  /**
   * Called on every frame tick update.
   * @param deltaTime Time elapsed in seconds since last frame
   */
  update(deltaTime: number): void;

  /**
   * Called when exiting the state.
   */
  exit(): void | Promise<void>;

  /**
   * Optional: Called when state is paused (e.g. when PausedState is pushed on top).
   */
  pause?(): void;

  /**
   * Optional: Called when state is resumed (e.g. when PausedState is popped).
   */
  resume?(): void;
}

/**
   Abstract base class for all concrete game states.
 */
export abstract class BaseGameState implements IGameState {
  public abstract readonly name: GameStateType;
  protected active: boolean = false;
  protected isPaused: boolean = false;

  public async enter(data?: GameStateData): Promise<void> {
    this.active = true;
    this.isPaused = false;
    await this.onEnter(data);
  }

  public update(deltaTime: number): void {
    if (!this.active || this.isPaused) return;
    this.onUpdate(deltaTime);
  }

  public async exit(): Promise<void> {
    this.active = false;
    await this.onExit();
  }

  public pause(): void {
    this.isPaused = true;
    this.onPause();
  }

  public resume(): void {
    this.isPaused = false;
    this.onResume();
  }

  protected async onEnter(data?: GameStateData): Promise<void> {}
  protected onUpdate(deltaTime: number): void {}
  protected async onExit(): Promise<void> {}
  protected onPause(): void {}
  protected onResume(): void {}
}
