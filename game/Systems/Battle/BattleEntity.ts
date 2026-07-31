import { StatsComponent } from '../Stats/StatsComponent';

export enum BattleStatus {
  NORMAL = 'NORMAL',
  POISONED = 'POISONED',
  BURNED = 'BURNED',
  FROZEN = 'FROZEN',
  SLEEPING = 'SLEEPING',
  SILENCED = 'SILENCED',
  BLINDED = 'BLINDED',
  PARALYZED = 'PARALYZED',
}

/**
 * Temporary wrapper entity for combat state.
 * Syncs only stats, buffs, and status effects.
 * Original entity remains untouched until combat finishes.
 */
export class BattleEntity {
  public id: string;
  public name: string;
  public classId: string;
  
  public stats: StatsComponent;
  public currentHp: number;
  public currentMp: number;
  
  public statusEffects: BattleStatus[] = [];
  public buffs: { name: string; duration: number }[] = [];

  constructor(originalEntity: any) {
    this.id = originalEntity.id;
    this.name = originalEntity.name;
    this.classId = originalEntity.classId;
    
    // Clone stats to prevent modifying original
    this.stats = new StatsComponent();
    // Assuming StatsComponent has a way to clone or copy values
    // For now, assume we copy from originalEntity.stats
    if (originalEntity.stats) {
      this.stats.copyFrom(originalEntity.stats);
    }
    
    this.currentHp = this.stats.getStat('maxHp')?.getValue() || 30;
    this.currentMp = this.stats.getStat('maxMp')?.getValue() || 10;
  }
}
