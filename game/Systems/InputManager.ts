import { Config } from '../Core/Config';
import { EventBus } from '../Core/EventBus';

/**
 * Handles keyboard and mouse/touch inputs, mapping standard keys to action triggers.
 * Includes fluid mouse and touch drag-to-pan handlers optimized for mobile viewport experiences.
 */
export class InputManager {
  private activeKeys: Set<string> = new Set();
  private actionStates: Map<string, boolean> = new Map();
  private eventBus: EventBus;

  // Virtual movement values for mobile touch overlay
  private virtualMovement: { x: number; z: number } = { x: 0, z: 0 };

  // Drag-to-pan states for mobile touch and desktop mouse drag
  private isDragging: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;
  private accumulatedDrag: { x: number; z: number } = { x: 0, z: 0 };
  private dragSensitivity: number = 0.04; // Converts screen pixels to world coordinates
  private isInputLocked: boolean = false;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.initListeners();
    this.initLockListener();
  }

  /**
   * Listens for system input locks (like dialogues)
   */
  private initLockListener(): void {
    this.eventBus.on('player:input:lock', (locked: boolean) => {
      this.isInputLocked = locked;
      if (locked) {
        // Clear active keys to prevent stuck keys after unlocking
        this.actionStates.clear();
        this.activeKeys.clear();
      }
    });
  }

  /**
   * Bind event listeners to document keyboard and touch events
   */
  private initListeners(): void {
    if (typeof window === 'undefined') return;

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse drag events
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    // Touch events for mobile support
    window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Avoid double firing or interfering with input fields if any
    if (event.repeat) return;

    const code = event.code;
    this.activeKeys.add(code);

    // Map code to action
    const action = this.getActionFromKey(code);
    if (action) {
      this.actionStates.set(action, true);
      this.eventBus.emit(`input:${action}:down`, { key: code });
    }
  };

  /**
   * Handle keyup event
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    const code = event.code;
    this.activeKeys.delete(code);

    const action = this.getActionFromKey(code);
    if (action) {
      this.actionStates.set(action, false);
      this.eventBus.emit(`input:${action}:up`, { key: code });
    }
  };

  /**
   * Mouse Drag Handlers
   */
  private handleMouseDown = (event: MouseEvent): void => {
    this.isDragging = true;
    this.lastDragX = event.clientX;
    this.lastDragY = event.clientY;
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.lastDragX;
    const deltaY = event.clientY - this.lastDragY;

    // Convert screen deltas into world coords. Dragging left moves camera right, etc.
    this.accumulatedDrag.x += -deltaX * this.dragSensitivity;
    this.accumulatedDrag.z += -deltaY * this.dragSensitivity;

    this.lastDragX = event.clientX;
    this.lastDragY = event.clientY;
  };

  private handleMouseUp = (): void => {
    this.isDragging = false;
  };

  /**
   * Touch/Mobile Drag Handlers
   */
  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.lastDragX = event.touches[0].clientX;
      this.lastDragY = event.touches[0].clientY;
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.isDragging || event.touches.length !== 1) return;

    // Prevent default scroll behaviors on mobile viewports
    event.preventDefault();

    const deltaX = event.touches[0].clientX - this.lastDragX;
    const deltaY = event.touches[0].clientY - this.lastDragY;

    // Translate touch swipes into overworld camera scrolls
    this.accumulatedDrag.x += -deltaX * this.dragSensitivity;
    this.accumulatedDrag.z += -deltaY * this.dragSensitivity;

    this.lastDragX = event.touches[0].clientX;
    this.lastDragY = event.touches[0].clientY;
  };

  private handleTouchEnd = (): void => {
    this.isDragging = false;
  };

  /**
   * Look up action mapped to a specific keyboard key code
   */
  private getActionFromKey(code: string): string | null {
    const keyMappings = Config.INPUTS.KEYS;
    for (const [action, keys] of Object.entries(keyMappings)) {
      if (keys.includes(code)) {
        return action;
      }
    }
    return null;
  }

  /**
   * Set on-screen virtual joystick or keyboard movement from Touch Overlay
   */
  public setVirtualMovement(x: number, z: number): void {
    this.virtualMovement.x = x;
    this.virtualMovement.z = z;
  }

  /**
   * Triggers an action press from a virtual/touch source
   */
  public triggerActionDown(action: string): void {
    if (this.isInputLocked) return;
    this.actionStates.set(action, true);
    this.eventBus.emit(`input:${action}:down`, { key: 'virtual' });
  }

  /**
   * Releases an action press from a virtual/touch source
   */
  public triggerActionUp(action: string): void {
    this.actionStates.set(action, false);
    this.eventBus.emit(`input:${action}:up`, { key: 'virtual' });
  }

  /**
   * Check if an action is currently being pressed down
   */
  public isActionPressed(action: string): boolean {
    return this.actionStates.get(action) || false;
  }

  /**
   * Get direction vector based on current movement buttons (normalized)
   */
  public getMovementVector(): { x: number; z: number } {
    if (this.isInputLocked) {
      return { x: 0, z: 0 };
    }

    let x = 0;
    let z = 0;

    if (this.isActionPressed('LEFT')) x -= 1;
    if (this.isActionPressed('RIGHT')) x += 1;
    if (this.isActionPressed('UP')) z -= 1;
    if (this.isActionPressed('DOWN')) z += 1;

    // Merge with virtual touch control inputs
    if (this.virtualMovement.x !== 0 || this.virtualMovement.z !== 0) {
      x = this.virtualMovement.x;
      z = this.virtualMovement.z;
    }

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z);
      x /= length;
      z /= length;
    }

    return { x, z };
  }

  /**
   * Retrieves the accumulated dragging force in world units, resetting it afterward
   */
  public getDragDelta(): { x: number; z: number } {
    const delta = { ...this.accumulatedDrag };
    this.accumulatedDrag = { x: 0, z: 0 };
    return delta;
  }

  /**
   * Destroy and clean up listeners
   */
  public destroy(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);

    this.activeKeys.clear();
    this.actionStates.clear();
  }
}
