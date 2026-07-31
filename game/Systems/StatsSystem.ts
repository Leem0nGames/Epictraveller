import { StatsComponent } from './Stats/StatsComponent';
import { StatModifierType } from './Stats/StatModifier';

export interface CalculatedDamageResult {
  rawDamage: number;
  finalDamage: number;
  isCritical: boolean;
  criticalMultiplier: number;
  mitigationPercent: number;
  breakBonus: number;
  resonanceBonus: number;
}

export interface LevelScalingInfo {
  level: number;
  requiredExp: number;
  totalExpToLevel: number;
  recommendedEncounterLevel: number;
  statMultiplier: number;
}

export class StatsSystem {
  private static instance: StatsSystem;

  public static getInstance(): StatsSystem {
    if (!StatsSystem.instance) {
      StatsSystem.instance = new StatsSystem();
    }
    return StatsSystem.instance;
  }

  constructor() {}

  /**
   * Calculates experience required for a specific level.
   * Curve is calibrated for 10-20 min daily sessions:
   * - Levels 1-5: Fast progression (1-2 battles per level)
   * - Levels 6-15: Steady progression (~1 level per 15 min daily session)
   * - Levels 16-30: Scaling endgame mastery curve
   */
  public getExpRequiredForLevel(level: number): number {
    if (level <= 1) return 100;
    if (level <= 5) return Math.floor(100 * Math.pow(level, 1.25));
    // Mid-game steady curve: ~100 * lvl^1.42
    return Math.floor(100 * Math.pow(level, 1.42));
  }

  /**
   * Calculates base stat growth for a player level up
   */
  public getLevelUpStatGains(level: number, archetypeId?: string | null): {
    atk: number;
    def: number;
    magicAtk: number;
    magicDef: number;
    hp: number;
    mp: number;
    speed: number;
  } {
    let hpGain = 15;
    let mpGain = 8;
    let atkGain = 3;
    let defGain = 2;
    let magicAtkGain = 3;
    let magicDefGain = 2;
    let speedGain = 1;

    // Archetype specialization tweaks
    if (archetypeId === 'WARRIOR') {
      hpGain = 22;
      atkGain = 5;
      defGain = 4;
      magicAtkGain = 1;
      magicDefGain = 1;
    } else if (archetypeId === 'MAGE') {
      mpGain = 16;
      magicAtkGain = 6;
      magicDefGain = 4;
      hpGain = 10;
      atkGain = 1;
    } else if (archetypeId === 'PALADIN') {
      hpGain = 20;
      mpGain = 10;
      defGain = 5;
      magicDefGain = 4;
      atkGain = 3;
    } else if (archetypeId === 'ASSASSIN') {
      speedGain = 2;
      atkGain = 5;
      magicAtkGain = 2;
      hpGain = 12;
    }

    return {
      hp: hpGain,
      mp: mpGain,
      atk: atkGain,
      def: defGain,
      magicAtk: magicAtkGain,
      magicDef: magicDefGain,
      speed: speedGain,
    };
  }

  /**
   * Calculates defense mitigation percentage with soft diminishing returns:
   * Mitigation = DEF / (DEF + 80 + TargetLevel * 5)
   */
  public calculateDefenseMitigation(defense: number, attackerLevel: number = 1): number {
    if (defense <= 0) return 0;
    const armorConstant = 80 + attackerLevel * 5;
    const mitigation = defense / (defense + armorConstant);
    return Math.min(0.75, mitigation); // Max 75% damage mitigation cap
  }

  /**
   * Calculates functional combat damage incorporating Atk/Def scaling,
   * Critical Hits, Break bonuses, and Stance multipliers.
   */
  public calculateDamage(params: {
    attackerAtk: number;
    attackerMagicAtk?: number;
    defenderDef: number;
    defenderMagicDef?: number;
    skillBasePower: number;
    isMagical?: boolean;
    attackerCritChance?: number;
    attackerCritMultiplier?: number;
    isTargetBroken?: boolean;
    isResonanceActive?: boolean;
    boostLevel?: number;
    attackerLevel?: number;
  }): CalculatedDamageResult {
    const isMagical = params.isMagical ?? false;
    const atk = isMagical ? (params.attackerMagicAtk ?? params.attackerAtk) : params.attackerAtk;
    const def = isMagical ? (params.defenderMagicDef ?? params.defenderDef) : params.defenderDef;

    // Base damage scaling: (ATK * 0.75 + Power * 0.85)
    let rawPower = atk * 0.75 + params.skillBasePower * 0.85;

    // Defense mitigation calculation
    const mitigationPercent = this.calculateDefenseMitigation(def, params.attackerLevel ?? 1);
    let mitigatedDamage = rawPower * (1 - mitigationPercent);

    // Boost Multiplier: Boost 0 = 1.0x, Boost 1 = 1.5x, Boost 2 = 2.0x, Boost 3 = 2.5x
    const boostLevel = params.boostLevel ?? 0;
    const boostMultiplier = 1.0 + boostLevel * 0.5;
    mitigatedDamage *= boostMultiplier;

    // Critical Hit Roll
    const critChance = (params.attackerCritChance ?? 5) / 100;
    const isCritical = Math.random() < critChance;
    const criticalMultiplier = isCritical ? (params.attackerCritMultiplier ?? 1.5) : 1.0;
    if (isCritical) {
      mitigatedDamage *= criticalMultiplier;
    }

    // Break & Resonance Bonuses
    let breakBonus = 1.0;
    if (params.isTargetBroken) {
      breakBonus = 2.0; // 100% bonus damage on Ruptura
    }

    let resonanceBonus = 1.0;
    if (params.isTargetBroken && params.isResonanceActive) {
      resonanceBonus = 1.5; // Additional 50% Overdrive Resonance!
    }

    const totalDamage = mitigatedDamage * breakBonus * resonanceBonus;

    // Random variance (+/- 8%)
    const variance = 0.92 + Math.random() * 0.16;
    const finalDamage = Math.max(1, Math.round(totalDamage * variance));

    return {
      rawDamage: Math.round(rawPower),
      finalDamage,
      isCritical,
      criticalMultiplier,
      mitigationPercent,
      breakBonus,
      resonanceBonus,
    };
  }

  public update(deltaTime: number): void {
    // Temporal modifier expiration, regenerative stat pulses, etc.
  }
}

