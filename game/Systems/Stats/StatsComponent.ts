import { StatValue } from './StatValue';
import { StatModifier } from './StatModifier';

export class StatsComponent {
  private stats: Map<string, StatValue> = new Map();

  public registerStat(name: string, baseValue: number): void {
    this.stats.set(name, new StatValue(baseValue));
  }

  public getStat(name: string): StatValue | undefined {
    return this.stats.get(name);
  }

  public getStatValue(name: string): number {
    return this.stats.get(name)?.getValue() ?? 0;
  }

  public addModifier(statName: string, modifier: StatModifier): void {
    this.stats.get(statName)?.addModifier(modifier);
  }

  public removeModifier(statName: string, modifierId: string): void {
    this.stats.get(statName)?.removeModifier(modifierId);
  }

  public copyFrom(other: StatsComponent): void {
    this.stats.clear();
    for (const [name, stat] of (other as any).stats.entries()) {
      this.registerStat(name, stat.baseValue);
      // We should also copy modifiers if needed, but for now base value is enough for temporary combat entity
    }
  }
}
