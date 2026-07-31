import { BaseScene } from './BaseScene';

/**
 * Orchestrates scene switching and updates, serving as the central 
 * control tower for what the graphics and logic loops execute.
 */
export class SceneManager {
  private activeScene: BaseScene | null = null;
  private scenes: Map<string, BaseScene> = new Map();

  constructor() {}

  /**
   * Register a scene into the manager list
   */
  public registerScene(name: string, scene: BaseScene): void {
    this.scenes.set(name, scene);
  }

  /**
   * Switch the current active scene to the registered name
   * @param name Name of the registered scene
   * @param mapData Optional map definition for scene initialization
   */
  public async switchTo(name: string, mapData?: any): Promise<void> {
    const nextScene = this.scenes.get(name);
    if (!nextScene) {
      console.error(`SceneManager: Scene "${name}" is not registered.`);
      return;
    }

    // Clean up current active scene first
    if (this.activeScene) {
      this.activeScene.destroy();
    }

    this.activeScene = nextScene;

    // Initialize the new scene
    await nextScene.init(mapData);
  }

  /**
   * Delegate update tick to active scene
   */
  public update(deltaTime: number): void {
    if (this.activeScene && this.activeScene.ready) {
      this.activeScene.update(deltaTime);
    }
  }

  /**
   * Retrieve active scene instance
   */
  public get current(): BaseScene | null {
    return this.activeScene;
  }

  /**
   * Clean up all loaded scenes
   */
  public destroy(): void {
    if (this.activeScene) {
      this.activeScene.destroy();
      this.activeScene = null;
    }
    this.scenes.clear();
  }
}
