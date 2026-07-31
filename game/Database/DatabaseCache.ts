export class DatabaseCache {
  public equipment = new Map<string, any>();
  public items = new Map<string, any>();
  public characters = new Map<string, any>();
  public enemies = new Map<string, any>();
  public npcs = new Map<string, any>();
  public skills = new Map<string, any>();
  public quests = new Map<string, any>();
  public maps = new Map<string, any>();
  public audio = new Map<string, any>();
  public shops = new Map<string, any>();
  public dialogues = new Map<string, any>();
  public effects = new Map<string, any>();
  public loot = new Map<string, any>();
  public localization = new Map<string, string>();

  public clear(): void {
    this.equipment.clear();
    this.items.clear();
    this.characters.clear();
    this.npcs.clear();
    this.enemies.clear();
    this.skills.clear();
    this.quests.clear();
    this.maps.clear();
    this.audio.clear();
    this.shops.clear();
    this.dialogues.clear();
    this.effects.clear();
    this.loot.clear();
    this.localization.clear();
  }
}
