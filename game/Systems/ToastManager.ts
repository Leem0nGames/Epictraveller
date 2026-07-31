import { EventBus } from '../Core/EventBus';

export class ToastManager {
  private static instance: ToastManager;
  
  public static getInstance(): ToastManager {
    if (!this.instance) this.instance = new ToastManager();
    return this.instance;
  }

  public show(message: string): void {
    EventBus.getInstance().emit('toast:show', message);
  }
}
