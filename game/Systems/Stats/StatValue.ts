import { StatModifier, StatModifierType } from './StatModifier';

export class StatValue {
  private baseValue: number;
  private modifiers: Map<string, StatModifier> = new Map();

  constructor(baseValue: number) {
    this.baseValue = baseValue;
  }

  public addModifier(modifier: StatModifier): void {
    this.modifiers.set(modifier.id, modifier);
  }

  public removeModifier(id: string): void {
    this.modifiers.delete(id);
  }

  public getBaseValue(): number {
    return this.baseValue;
  }

  public setBaseValue(value: number): void {
    this.baseValue = value;
  }

  public getValue(): number {
    let flatValue = this.baseValue;
    let percentBonus = 0;

    for (const modifier of this.modifiers.values()) {
      if (modifier.type === StatModifierType.FLAT) {
        flatValue += modifier.value;
      } else if (modifier.type === StatModifierType.PERCENT) {
        percentBonus += modifier.value;
      }
    }

    return flatValue * (1 + percentBonus);
  }
}
