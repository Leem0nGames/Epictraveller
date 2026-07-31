import { BattleEntity } from './BattleEntity';

export class BattleCalculator {
  public static calculateDamage(attacker: BattleEntity, target: BattleEntity): number {
    const attack = attacker.stats.getStat('attack')?.getValue() || 0;
    const defense = target.stats.getStat('defense')?.getValue() || 0;
    
    // Simple damage formula: (Atk - Def/2) + variation
    const baseDamage = Math.max(1, attack - Math.floor(defense / 2));
    const variation = Math.floor(Math.random() * 3) - 1; // -1 to 1
    
    return baseDamage + variation;
  }

  public static canHit(attacker: BattleEntity, target: BattleEntity): boolean {
    // Simplified accuracy check
    return Math.random() > 0.1; // 90% hit rate
  }
}
