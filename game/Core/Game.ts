import * as THREE from 'three';
import { Time } from './Time';
import { EventBus } from './EventBus';
import { GameStateManager } from './GameStateManager';
import { MainMenuState, OverworldState, CombatState, PausedState, GameOverState } from '../States';
import { Renderer } from '../Graphics/Renderer';
import { Camera } from '../Graphics/Camera';
import { SceneManager } from '../Scenes/SceneManager';
import { OverworldScene } from '../Scenes/OverworldScene';
import { BattleScene } from '../Scenes/BattleScene';
import { InputManager } from '../Systems/InputManager';
import { AssetLoader } from '../Systems/AssetLoader';
import { CameraController } from '../Systems/CameraController';
import { DialogueSystem } from '../Systems/DialogueSystem';
import { EventSystem } from '../Systems/EventSystem';
import { MobileManager } from '../Mobile/MobileManager';
import { Config } from './Config';
import { DatabaseManager } from '../Database/DatabaseManager';

/**
 * Main game engine controller.
 * Boots graphics, assets, scene states, and manages the high-precision gameloop.
 */
export class Game {
  private static instance: Game | null = null;

  // Core subsystems
  private time!: Time;
  private eventBus!: EventBus;
  private stateManager!: GameStateManager;
  private renderer!: Renderer;
  private camera!: Camera;
  private cameraController!: CameraController;
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private assetLoader!: AssetLoader;
  private dialogueSystem!: DialogueSystem;
  private eventSystem!: EventSystem;
  private mobileManager!: MobileManager;

  // Game Loop variable
  private animationFrameId: number | null = null;
  private container: HTMLElement;
  private isRunning: boolean = false;

  // Telemetry updates
  private debugTimer: number = 0;

  private constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initializes and starts the game engine instance
   */
  public static init(container: HTMLElement): Game {
    if (Game.instance) {
      Game.instance.destroy();
    }
    Game.instance = new Game(container);
    Game.instance.boot();
    return Game.instance;
  }

  /**
   * Get active Game engine instance
   */
  public static getInstance(): Game | null {
    return Game.instance;
  }

  /**
   * Public getter for InputManager
   */
  public get input(): InputManager {
    return this.inputManager;
  }

  /**
   * Public getter for CameraController
   */
  public get camController(): CameraController {
    return this.cameraController;
  }

  /**
   * Public getter for SceneManager
   */
  public get scenes(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Public getter for GameStateManager
   */
  public get state(): GameStateManager {
    return this.stateManager;
  }

  /**
   * Public getter for active THREE.PerspectiveCamera
   */
  public get rawCamera(): THREE.PerspectiveCamera | null {
    return this.camera ? this.camera.raw : null;
  }

  /**
   * Boots subsystems sequentially
   */
  private async boot(): Promise<void> {
    this.eventBus = EventBus.getInstance();
    this.time = new Time();
    this.inputManager = new InputManager();
    this.assetLoader = new AssetLoader();
    
    // Instantiate Dialogue and Event subsystems
    this.dialogueSystem = new DialogueSystem();
    this.eventSystem = new EventSystem();

    // Instantiate Mobile Manager
    this.mobileManager = new MobileManager();

    // Instantiate Game State Manager and register default game states
    this.stateManager = GameStateManager.getInstance();
    this.stateManager.registerState(new MainMenuState());
    this.stateManager.registerState(new OverworldState());
    this.stateManager.registerState(new CombatState());
    this.stateManager.registerState(new PausedState());
    this.stateManager.registerState(new GameOverState());

    // Register event bus listeners for state management requests
    this.eventBus.on('gamestate:request_change', (payload: { state: string; data?: any }) => {
      this.stateManager.changeState(payload.state, payload.data);
    });
    this.eventBus.on('gamestate:request_push', (payload: { state: string; data?: any }) => {
      this.stateManager.pushState(payload.state, payload.data);
    });
    this.eventBus.on('gamestate:request_pop', () => {
      this.stateManager.popState();
    });
    this.eventBus.on('input:PAUSE:down', () => {
      if (this.stateManager.currentStateType === 'Paused') {
        this.stateManager.popState();
      } else {
        this.stateManager.pushState('Paused');
      }
    });

    if (typeof window !== 'undefined') {
      (window as any)._gameInstance = this;
    }

    // Setup graphics pipeline
    this.renderer = new Renderer(this.container);
    this.camera = new Camera(this.container);
    
    // Instantiates decoupled smooth camera tracking controller
    this.cameraController = new CameraController(this.camera.raw);

    this.sceneManager = new SceneManager();

    // Attach resize window hooks
    window.addEventListener('resize', this.handleResize);

    // Subscribe to asset loading progress
    this.eventBus.on('asset:progress', (progress: number) => {
      console.log(`Loading Game Assets... ${Math.round(progress * 100)}%`);
    });

    // Initialize Database
    try {
      await DatabaseManager.getInstance().initialize();
      console.log('DatabaseManager: Initialized successfully');
    } catch (err) {
      console.error('DatabaseManager: Failed to initialize', err);
    }

    // Start loading
    await this.assetLoader.loadAll();

    // Register scenes
    const overworld = new OverworldScene(this.assetLoader, this.inputManager);
    this.sceneManager.registerScene('Overworld', overworld);

    const battle = new BattleScene(this.assetLoader);
    this.sceneManager.registerScene('Battle', battle);

    // Boot into Overworld game state
    await this.stateManager.changeState('Overworld');

    // Start rendering frame loop
    this.isRunning = true;
    this.loop();
  }

  /**
   * Frame Tick Game Loop
   */
  private loop = (): void => {
    if (!this.isRunning) return;

    // 1. Calculate time passed (deltaTime)
    const dt = this.time.update();

    // 2. Process active game state and scene inputs/updates
    this.stateManager.update(dt);
    this.sceneManager.update(dt);

    // 3. Smooth camera tracking follow
    const activeScene = this.sceneManager.current;
    if (activeScene && typeof (activeScene as any).getCameraFocus === 'function') {
      const focus = (activeScene as any).getCameraFocus();
      if (focus) {
        const t = 1.0 - Math.exp(-6.0 * dt);
        this.camera.raw.position.lerp(focus.position, t);
        this.camera.raw.lookAt(focus.target);
      }
    } else if (activeScene && typeof (activeScene as any).getPlayer === 'function') {
      const player = (activeScene as any).getPlayer();
      if (player) {
        if (this.cameraController.activeTarget !== player) {
          this.cameraController.setTarget(player);
        }

        // Periodic debug overlay metrics emit via EventBus
        this.debugTimer += dt;
        if (this.debugTimer >= (Config.DEBUG?.UPDATE_RATE ?? 0.1)) {
          this.debugTimer = 0;
          const fps = dt > 0 ? Math.round(1.0 / dt) : 0;
          const world = (activeScene as any).getWorld();
          this.eventBus.emit('game:debug', {
            fps,
            playerX: player.position.x,
            playerY: player.position.y,
            playerZ: player.position.z,
            state: player.getPlayerState(),
            direction: player.getLookDirection(),
            animation: player.animator ? player.animator.activeAnimation : 'N/A',
            activeEntities: world ? world.getAllEntities().length : 0,
            collidersEnabled: world ? world.isDebugEnabled() : false,
            autoOrbitEnabled: this.cameraController.isAutoOrbitEnabled(),
          });
        }
      }
    }

    // Tick camera tracking forwards (only if not in custom cinematic focus)
    if (activeScene && typeof (activeScene as any).getCameraFocus !== 'function') {
      this.cameraController.update(dt);
    }

    // 4. Render graphics output
    const currentScene = this.sceneManager.current;
    if (currentScene) {
      this.renderer.render(currentScene.raw, this.camera.raw);
    }

    // Tick Mobile Manager for telemetry/performance monitoring
    if (this.mobileManager && this.renderer) {
      this.mobileManager.tick(dt, this.renderer.raw);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Resize viewport trigger
   */
  private handleResize = (): void => {
    if (this.renderer) this.renderer.resize();
    if (this.camera) this.camera.resize();
  };

  /**
   * Fully teardown engine, freeing GL contexts and unbinding inputs.
   */
  public destroy(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    if (this.renderer) this.renderer.destroy();
    if (this.stateManager) this.stateManager.destroy();
    if (this.sceneManager) this.sceneManager.destroy();
    if (this.assetLoader) this.assetLoader.destroy();
    if (this.inputManager) this.inputManager.destroy();
    if (this.dialogueSystem) this.dialogueSystem.destroy();
    if (this.eventSystem) this.eventSystem.destroy();
    if (this.mobileManager) this.mobileManager.destroy();
    if (this.eventBus) this.eventBus.clear();

    if (typeof window !== 'undefined') {
      delete (window as any)._gameInstance;
    }

    Game.instance = null;
  }
}
