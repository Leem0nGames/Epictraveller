export class DebugManager {
  private static instance: DebugManager;
  private enabled: boolean = false;
  private tools: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  public init(): void {
    // Only enable if explicitly set, e.g., via localStorage for dev
    if (typeof window !== 'undefined' && localStorage.getItem('ENABLE_DEBUG') === 'true') {
      this.enabled = true;
      console.log('DebugManager initialized');
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public registerTool(name: string, tool: any): void {
    this.tools.set(name, tool);
  }

  public getTool(name: string): any {
    return this.tools.get(name);
  }
}
