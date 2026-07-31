import { IGameState, GameStateType, GameStateData } from './GameState';
import { EventBus } from './EventBus';

/**
 * Manages game state stack, lifecycle transitions (enter, update, exit, pause, resume),
 * and emits state events via EventBus.
 */
export class GameStateManager {
  private static instance: GameStateManager | null = null;
  private states: Map<GameStateType, IGameState> = new Map();
  private stateStack: IGameState[] = [];
  private eventBus: EventBus;
  private isTransitioning: boolean = false;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * Register a game state definition
   */
  public registerState(state: IGameState): void {
    this.states.set(state.name, state);
  }

  /**
   * Retrieves a registered state by type name
   */
  public getState(name: GameStateType): IGameState | undefined {
    return this.states.get(name);
  }

  /**
   * Current active state at the top of the stack
   */
  public get currentState(): IGameState | null {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
  }

  /**
   * Name of current active state
   */
  public get currentStateType(): GameStateType | null {
    return this.currentState ? this.currentState.name : null;
  }

  /**
   * Check if state is in state stack
   */
  public hasStateInStack(name: GameStateType): boolean {
    return this.stateStack.some(s => s.name === name);
  }

  /**
   * Fully switch to a new state (clears state stack and enters new state)
   */
  public async changeState(name: GameStateType, data?: GameStateData): Promise<void> {
    if (this.isTransitioning) return;
    const nextState = this.states.get(name);
    if (!nextState) {
      console.error(`GameStateManager: State "${name}" is not registered.`);
      return;
    }

    const previousStateName = this.currentStateType;
    this.isTransitioning = true;

    // Pop and exit all states in stack
    while (this.stateStack.length > 0) {
      const state = this.stateStack.pop();
      if (state) {
        await state.exit();
      }
    }

    // Push and enter new state
    this.stateStack.push(nextState);
    await nextState.enter(data);

    this.isTransitioning = false;

    // Emit event via EventBus for UI and subsystems
    this.eventBus.emit('gamestate:changed', {
      previousState: previousStateName,
      currentState: nextState.name,
      data,
    });
  }

  /**
   * Push a new state on top of the stack (e.g. pushing 'Paused' over 'Overworld' or 'Combat')
   */
  public async pushState(name: GameStateType, data?: GameStateData): Promise<void> {
    if (this.isTransitioning) return;
    const nextState = this.states.get(name);
    if (!nextState) {
      console.error(`GameStateManager: Cannot push unregistered state "${name}".`);
      return;
    }

    const previousState = this.currentState;
    this.isTransitioning = true;

    // Pause current active state if present
    if (previousState) {
      if (previousState.pause) {
        previousState.pause();
      }
    }

    this.stateStack.push(nextState);
    await nextState.enter(data);

    this.isTransitioning = false;

    this.eventBus.emit('gamestate:pushed', {
      previousState: previousState ? previousState.name : null,
      currentState: nextState.name,
      data,
    });
    this.eventBus.emit('gamestate:changed', {
      previousState: previousState ? previousState.name : null,
      currentState: nextState.name,
      data,
    });
  }

  /**
   * Pop top state from stack (e.g. unpausing)
   */
  public async popState(): Promise<IGameState | null> {
    if (this.isTransitioning || this.stateStack.length <= 1) {
      // Don't pop last state or while transitioning
      return null;
    }

    this.isTransitioning = true;
    const exitingState = this.stateStack.pop();

    if (exitingState) {
      await exitingState.exit();
    }

    const resumingState = this.currentState;
    if (resumingState) {
      if (resumingState.resume) {
        resumingState.resume();
      }
    }

    this.isTransitioning = false;

    this.eventBus.emit('gamestate:popped', {
      poppedState: exitingState ? exitingState.name : null,
      currentState: resumingState ? resumingState.name : null,
    });
    this.eventBus.emit('gamestate:changed', {
      previousState: exitingState ? exitingState.name : null,
      currentState: resumingState ? resumingState.name : null,
    });

    return exitingState || null;
  }

  /**
   * Update tick called from Game loop
   */
  public update(deltaTime: number): void {
    if (this.currentState) {
      this.currentState.update(deltaTime);
    }
  }

  /**
   * Stop/Reset current active states
   */
  public async stop(): Promise<void> {
    while (this.stateStack.length > 0) {
      const state = this.stateStack.pop();
      if (state) {
        await state.exit();
      }
    }
    this.eventBus.emit('gamestate:stopped');
  }

  /**
   * Clear registered states and stack
   */
  public destroy(): void {
    this.stop();
    this.states.clear();
    GameStateManager.instance = null;
  }
}
