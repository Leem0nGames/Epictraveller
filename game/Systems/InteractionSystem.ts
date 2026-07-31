import { EventBus } from '../Core/EventBus';
import { World } from '../World/World';
import { Player } from '../Entities/Player';
import { InteractableTarget } from '../Entities/InteractableTarget';
import { DialogueSystem } from './DialogueSystem';

/**
 * Decoupled Proximity and Key Action Interaction System.
 * Identifies the closest Interactable target (props or NPCs), triggers visual cues,
 * and handles the 'ACTION' (E / Space) keyboard event listeners.
 */
export class InteractionSystem {
  private world: World;
  private activeInteractable: InteractableTarget | null = null;
  private eventBus: EventBus;
  private interactionStartTime: number = 0;
  private isInteracting: boolean = false;

  constructor(world: World) {
    this.world = world;
    this.eventBus = EventBus.getInstance();
    
    // Wire keyboard listener event from InputManager
    this.eventBus.on('input:ACTION:down', this.handleInteractionPress);
    this.eventBus.on('dialogue:end', () => {
      this.isInteracting = false;
    });
  }

  /**
   * Periodic tick query. Matches player positions with nearby interactable objects.
   */
  public update(player: Player): void {
    if (!player) return;

    // Emergency release check
    if (this.isInteracting && Date.now() - this.interactionStartTime > 30000) {
      console.warn('Emergency release: interaction timed out.');
      this.isInteracting = false;
      this.eventBus.emit('player:input:lock', false);
    }
    
    const interactables = this.world.getInteractables();
    let closestItem: InteractableTarget | null = null;
    let minDistance = Infinity;

    // Evaluate proximity ranges
    interactables.forEach((item) => {
      if (!item.isActive) return;

      const distance = player.position.distanceTo(item.position);
      if (distance <= item.interactionRadius) {
        if (distance < minDistance) {
          minDistance = distance;
          closestItem = item;
        }
      }
    });

    // If active target changes, toggle the visual hover prompts on old and new targets
    const prevInteractable = this.activeInteractable;
    if (closestItem !== prevInteractable) {
      if (prevInteractable) {
        prevInteractable.setNearPlayer(false);
      }
      
      this.activeInteractable = closestItem;
      
      if (this.activeInteractable) {
        (this.activeInteractable as InteractableTarget).setNearPlayer(true);
      }
    }
  }

  /**
   * Action key triggered by EventBus
   */
  private handleInteractionPress = (): void => {
    // Failsafe: If we are "interacting" but dialogue is not active, recover from stuck state
    if (this.isInteracting && !DialogueSystem.getInstance()?.isActive) {
      console.warn("Recovering from stuck interaction state.");
      this.eventBus.emit('player:input:lock', false);
      this.isInteracting = false;
    }

    // Prevent interaction if dialogue is already active
    if (DialogueSystem.getInstance()?.isActive) {
      return;
    }

    if (this.activeInteractable) {
      this.isInteracting = true;
      this.interactionStartTime = Date.now();
      this.activeInteractable.onInteract();
    }
  };

  /**
   * Clean up event bindings
   */
  public destroy(): void {
    this.eventBus.off('input:ACTION:down', this.handleInteractionPress);
    if (this.activeInteractable) {
      this.activeInteractable.setNearPlayer(false);
      this.activeInteractable = null;
    }
  }
}
