import { EventBus } from '../Core/EventBus';
import dialoguesData from '../Data/dialogues.json';

export interface DialogueNode {
  speaker: string;
  lines: string[];
  events?: any[];
}

/**
 * Reusable and decoupled Dialogue System.
 * Manages active conversation line progression, input locking, and triggers dialogue events.
 */
export class DialogueSystem {
  private static instance: DialogueSystem | null = null;
  private eventBus: EventBus;
  private dialogues: Record<string, DialogueNode> = {};
  
  // Conversation states
  private currentDialogueId: string | null = null;
  private currentSpeaker: string = '';
  private currentLines: string[] = [];
  private currentLineIndex: number = -1;
  private activeEvents: any[] = [];
  private activeNpcId: string | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.dialogues = dialoguesData as Record<string, DialogueNode>;
    DialogueSystem.instance = this;

    this.initListeners();
  }

  /**
   * Static singleton getter
   */
  public static getInstance(): DialogueSystem | null {
    return DialogueSystem.instance;
  }

  /**
   * Sets up event bindings
   */
  private initListeners(): void {
    // Listen for incoming NPC dialog trigger signals
    this.eventBus.on('dialogue:trigger', this.handleDialogueTrigger);
    
    // Wire up UI-driven progression handlers
    this.eventBus.on('dialogue:next', () => this.advanceDialogue());
    this.eventBus.on('dialogue:close', () => this.closeDialogue());
    
    // Bind window-level keyboard listener for dialog progression
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleGlobalKeyDown);
    }
  }

  /**
   * Handles starting a dialogue from dialogueId
   */
  private handleDialogueTrigger = (data: { dialogueId: string; speaker?: string; npcId?: string }): void => {
    const node = this.dialogues[data.dialogueId];
    if (!node) {
      console.warn(`[DialogueSystem] Dialogue ID "${data.dialogueId}" was not found in database.`);
      return;
    }

    this.startDialogue(data.dialogueId, node, data.npcId || null);
  };

  /**
   * Starts a dialogue node, locks movement inputs, and emits the initial line
   */
  public startDialogue(id: string, node: DialogueNode, npcId: string | null = null): void {
    this.currentDialogueId = id;
    this.currentSpeaker = node.speaker;
    this.currentLines = node.lines;
    this.currentLineIndex = 0;
    this.activeEvents = node.events || [];
    this.activeNpcId = npcId;

    // 1. Lock player movement coordinates translation
    this.eventBus.emit('player:input:lock', true);

    // 2. Broadcast state changes to the UI overlays
    this.eventBus.emit('dialog:start', {
      id: this.currentDialogueId,
      speaker: this.currentSpeaker,
      text: this.currentLines[this.currentLineIndex],
      lineIndex: this.currentLineIndex,
      totalLines: this.currentLines.length,
    });

    // Legacy backup emit
    this.eventBus.emit('hud:dialog', {
      sender: this.currentSpeaker,
      text: this.currentLines[this.currentLineIndex],
      id: npcId || id,
    });

    console.log(`[DialogueSystem] Conversation started: "${id}"`);
  }

  /**
   * Advances to the next line or terminates the conversation
   */
  public advanceDialogue(): void {
    if (!this.currentDialogueId) return;

    this.currentLineIndex++;

    if (this.currentLineIndex < this.currentLines.length) {
      // Progress to next slide
      this.eventBus.emit('dialog:update', {
        id: this.currentDialogueId,
        speaker: this.currentSpeaker,
        text: this.currentLines[this.currentLineIndex],
        lineIndex: this.currentLineIndex,
        totalLines: this.currentLines.length,
      });

      this.eventBus.emit('hud:dialog', {
        sender: this.currentSpeaker,
        text: this.currentLines[this.currentLineIndex],
        id: this.activeNpcId || this.currentDialogueId,
      });
    } else {
      // No slides left, close conversation
      this.closeDialogue();
    }
  }

  /**
   * Clean up dialogue contexts, releases movement locks, and runs queued events
   */
  public closeDialogue(): void {
    if (!this.currentDialogueId) return;

    const finishedId = this.currentDialogueId;
    const finishedEvents = [...this.activeEvents];

    // Reset properties
    this.currentDialogueId = null;
    this.currentSpeaker = '';
    this.currentLines = [];
    this.currentLineIndex = -1;
    this.activeEvents = [];
    this.activeNpcId = null;

    // 1. Release movement locks on player
    this.eventBus.emit('player:input:lock', false);

    // 2. Clear UI dialogues
    this.eventBus.emit('dialog:end', { id: finishedId });
    this.eventBus.emit('hud:dialog', null);

    // 3. Fire the custom scripts / items sequence on EventSystem
    if (finishedEvents.length > 0) {
      this.eventBus.emit('events:execute', finishedEvents);
    }

    console.log(`[DialogueSystem] Conversation finished: "${finishedId}". Input locks cleared.`);
  }

  /**
   * Maps window level keyboard shortcuts during active chats
   */
  private handleGlobalKeyDown = (event: KeyboardEvent): void => {
    if (!this.currentDialogueId) return;

    // Block native scroll behaviors
    if (['Space', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
      event.preventDefault();
    }

    // Advance dialogues
    if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') {
      this.advanceDialogue();
    }
    // Dismiss/close dialogue
    else if (event.code === 'Escape' || event.code === 'KeyQ') {
      this.closeDialogue();
    }
  };

  /**
   * Active flag query
   */
  public get isActive(): boolean {
    return this.currentDialogueId !== null;
  }

  /**
   * Cleanup bindings
   */
  public destroy(): void {
    this.eventBus.off('dialogue:trigger', this.handleDialogueTrigger);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleGlobalKeyDown);
    }
    DialogueSystem.instance = null;
  }
}
