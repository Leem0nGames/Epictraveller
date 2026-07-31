import { EventBus } from '../Core/EventBus';

export class DialogueWindow {
  private element: HTMLDivElement;
  private nameLabel: HTMLDivElement;
  private textLabel: HTMLDivElement;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
    
    // Create UI elements
    this.element = document.createElement('div');
    this.element.className = 'dialogue-window';
    this.element.style.display = 'none'; // Hidden initially
    this.element.style.position = 'absolute';
    this.element.style.bottom = '20px';
    this.element.style.left = '50%';
    this.element.style.transform = 'translateX(-50%)';
    this.element.style.width = '80%';
    this.element.style.padding = '20px';
    this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.element.style.color = 'white';
    this.element.style.borderRadius = '10px';
    this.element.style.border = '2px solid #ffaa00';
    this.element.style.zIndex = '1000';
    this.element.style.fontFamily = 'sans-serif';

    this.nameLabel = document.createElement('div');
    this.nameLabel.style.fontWeight = 'bold';
    this.nameLabel.style.marginBottom = '10px';
    this.nameLabel.style.color = '#ffaa00';

    this.textLabel = document.createElement('div');
    this.textLabel.style.fontSize = '18px';

    this.element.appendChild(this.nameLabel);
    this.element.appendChild(this.textLabel);
    document.body.appendChild(this.element);

    this.initListeners();
  }

  private initListeners(): void {
    this.eventBus.on('dialog:start', (data: any) => this.show(data));
    this.eventBus.on('dialog:update', (data: any) => this.updateText(data));
    this.eventBus.on('dialog:end', () => this.hide());
    
    // Allow clicking the window to advance dialogue
    this.element.addEventListener('click', () => {
      this.eventBus.emit('dialogue:next');
    });
  }

  private show(data: any): void {
    this.nameLabel.innerText = data.speaker;
    this.textLabel.innerText = data.text;
    this.element.style.display = 'block';
  }

  private updateText(data: any): void {
    this.textLabel.innerText = data.text;
  }

  private hide(): void {
    this.element.style.display = 'none';
  }

  public destroy(): void {
    document.body.removeChild(this.element);
    this.eventBus.off('dialog:start', (data: any) => this.show(data));
    this.eventBus.off('dialog:update', (data: any) => this.updateText(data));
    this.eventBus.off('dialog:end', () => this.hide());
  }
}
