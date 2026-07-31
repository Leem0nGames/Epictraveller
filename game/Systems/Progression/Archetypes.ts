import { SkillDefinition } from '../OctopathCombatEngine';

export interface TalentNode {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: number; // Tier 1 (Level 5), Tier 2 (Level 7), Tier 3 (Level 10), Tier 4 (Level 12)
  reqLevel: number;
  cost: number;
  prerequisites?: string[];
  statBonus?: {
    attack?: number;
    defense?: number;
    hp?: number;
    mp?: number;
  };
  skillUnlock?: SkillDefinition;
  passiveDescription?: string;
}

export interface PassiveTalentDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxRanks: number;
  costPerRank: number;
  statPerRank: {
    hp?: number;
    mp?: number;
    attack?: number;
    defense?: number;
    manaRegen?: number;
    elementalResist?: number;
  };
}

export interface ArchetypeDefinition {
  id: string;
  name: string;
  title: string;
  icon: string;
  badgeColor: string;
  description: string;
  passiveName: string;
  passiveDescription: string;
  statBonuses: {
    attack: number;
    defense: number;
    hp: number;
    mp: number;
  };
  skills: SkillDefinition[];
  talentTree: TalentNode[];
  passiveTalents: PassiveTalentDefinition[];
}

export const ARCHETYPES: Record<string, ArchetypeDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Guerrero Kshatriya-Valkyria',
    title: 'Guardián de la Espada Rúnica y Fuego de Indra',
    icon: '⚔️',
    badgeColor: 'from-amber-600 to-rose-700 text-amber-100 border-amber-400',
    description: 'Especializado en combate cuerpo a cuerpo devastador. Canaliza el coraje de las Valkyrias y la disciplina de los Kshatriya en Midgard-Loka.',
    passiveName: 'Baluarte del Dharma',
    passiveDescription: '+25% Daño físico con hojas rúnicas y +40 HP máximos por la gracia de Odín e Indra.',
    statBonuses: {
      attack: 15,
      defense: 10,
      hp: 40,
      mp: 10,
    },
    skills: [
      {
        id: 'corte_vorpal',
        name: 'Corte Rúnico Kshatriya',
        description: 'Ataque pesado de 2 impactos de acero sagrado que desgarra la coraza del enemigo.',
        mpCost: 10,
        weaknessType: 'SWORD',
        hitCount: 2,
        basePower: 28,
        category: 'PHYSICAL',
      },
    ],
    talentTree: [
      {
        id: 'warrior_t1_fuerza',
        name: 'Fuerza de los Asuras',
        icon: '💪',
        description: 'Despierta el ímpetu titánico, incrementando el ataque físico en +8 PTS.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { attack: 8 },
      },
      {
        id: 'warrior_t1_resistencia',
        name: 'Armadura de Einherjar',
        icon: '🛡️',
        description: 'Forja la piel con acero bendito de Valhalla aumentando +10 Defensa y +25 HP máximos.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { defense: 10, hp: 25 },
      },
      {
        id: 'warrior_t2_tajo',
        name: 'Tajo del Karma',
        icon: '🗡️',
        description: 'Desbloquea la técnica activa Tajo del Karma: golpe brutal que purifica las sombras.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['warrior_t1_fuerza'],
        skillUnlock: {
          id: 'tajo_hendidor',
          name: 'Tajo del Karma',
          description: 'Impacto brutal de espada rúnica que corta la armadura y equilibra la batalla.',
          mpCost: 12,
          weaknessType: 'SWORD',
          hitCount: 2,
          basePower: 32,
          category: 'PHYSICAL',
        },
      },
      {
        id: 'warrior_t2_vigor',
        name: 'Prana del Combate',
        icon: '❤️',
        description: 'Amplía la reserva vital con +35 HP máximos y +5 Ataque.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['warrior_t1_resistencia'],
        statBonus: { hp: 35, attack: 5 },
      },
      {
        id: 'warrior_t3_furia',
        name: 'Ira de Agni-Thor',
        icon: '🔥',
        description: 'Potencia destructiva de fuego y trueno con +15 Ataque físico.',
        tier: 3,
        reqLevel: 10,
        cost: 1,
        prerequisites: ['warrior_t2_tajo'],
        statBonus: { attack: 15 },
      },
      {
        id: 'warrior_t4_cataclismo',
        name: 'Ragnarök Kshatriya',
        icon: '💥',
        description: 'Técnica Definitiva: 4 estocadas imparables embuidas en la ira sagrada de Asgard-Samsara.',
        tier: 4,
        reqLevel: 12,
        cost: 2,
        prerequisites: ['warrior_t3_furia'],
        skillUnlock: {
          id: 'ira_cataclismo',
          name: 'Ragnarök Kshatriya',
          description: 'Ráfaga devastadora de 4 tajos rúnicos que disuelven la oscuridad de Vritra.',
          mpCost: 20,
          weaknessType: 'SWORD',
          hitCount: 4,
          basePower: 38,
          category: 'PHYSICAL',
        },
      },
    ],
    passiveTalents: [
      {
        id: 'warrior_pas_hp',
        name: 'Coraza del Dharma',
        icon: '🛡️',
        description: 'Sostiene la resistencia vital de la vanguardia guerrera.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { hp: 16 },
      },
      {
        id: 'warrior_pas_regen',
        name: 'Respiración de Fuego',
        icon: '⚡',
        description: 'Meditación guerrera para regenerar Prana Rúnico al inicio de cada turno.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { manaRegen: 3, mp: 5 },
      },
      {
        id: 'warrior_pas_resist',
        name: 'Piel de Vritra',
        icon: '🐉',
        description: 'Aumenta la resistencia defensiva frente al veneno y la magia enemiga.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { defense: 2, elementalResist: 4 },
      },
      {
        id: 'warrior_pas_atk',
        name: 'Mandato de Odín',
        icon: '💥',
        description: 'Incrementa la potencia de cada estocada física.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { attack: 4 },
      },
    ],
  },
  archer: {
    id: 'archer',
    name: 'Cazador Gandiva-Bifrost',
    title: 'Arquero del Rayo Celestial e Indra',
    icon: '🏹',
    badgeColor: 'from-emerald-600 to-teal-700 text-emerald-100 border-emerald-400',
    description: 'Experto en velocidad, saetas perforantes con el arco divino Gandiva y rastreo en los senderos de Bifrost.',
    passiveName: 'Ojo de Garuda',
    passiveDescription: '+20% Probabilidad Crítica y disparos pránicos perforantes.',
    statBonuses: {
      attack: 12,
      defense: 6,
      hp: 25,
      mp: 15,
    },
    skills: [
      {
        id: 'lluvia_flechas',
        name: 'Ráfaga de Gandiva',
        description: 'Dispara 3 saetas imbuidas en el rayo de Indra que perforan corazas.',
        mpCost: 12,
        weaknessType: 'SWORD',
        hitCount: 3,
        basePower: 18,
        category: 'PHYSICAL',
      },
    ],
    talentTree: [
      {
        id: 'archer_t1_punteria',
        name: 'Drishti de Caza',
        icon: '🎯',
        description: 'Precisión espiritual aumentando el Ataque en +7 PTS y el Prana/MP en +10 PTS.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { attack: 7, mp: 10 },
      },
      {
        id: 'archer_t1_paso',
        name: 'Paso de Bifrost',
        icon: '🍃',
        description: 'Agilidad mística en el puente de luz, otorgando +20 HP y +6 Defensa.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { hp: 20, defense: 6 },
      },
      {
        id: 'archer_t2_perforante',
        name: 'Flecha Astra',
        icon: '🏹',
        description: 'Desbloquea el ataque perforante de 2 disparos celestiales.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['archer_t1_punteria'],
        skillUnlock: {
          id: 'disparo_perforante',
          name: 'Flecha Astra',
          description: 'Flecha divina imbuida en el Prana de los devalokas que atraviesa defensas.',
          mpCost: 11,
          weaknessType: 'SWORD',
          hitCount: 2,
          basePower: 26,
          category: 'PHYSICAL',
        },
      },
      {
        id: 'archer_t2_veneno',
        name: 'Ponzoña de Nidhogg',
        icon: '🧪',
        description: 'Carga las flechas con esencias oscuras aumentando +10 Ataque y +15 MP.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['archer_t1_paso'],
        statBonus: { attack: 10, mp: 15 },
      },
      {
        id: 'archer_t3_sombra',
        name: 'Manto de las Nornas',
        icon: '👤',
        description: 'Sigilo entre los hilos del destino, aumentando el Ataque en +14 PTS.',
        tier: 3,
        reqLevel: 10,
        cost: 1,
        prerequisites: ['archer_t2_perforante'],
        statBonus: { attack: 14 },
      },
      {
        id: 'archer_t4_rafaga',
        name: 'Lluvia de Indra-Bifrost',
        icon: '🌟',
        description: 'Técnica Definitiva: Voluntad celestial de 5 saetas sagradas de energía pránica.',
        tier: 4,
        reqLevel: 12,
        cost: 2,
        prerequisites: ['archer_t3_sombra'],
        skillUnlock: {
          id: 'rafaga_celestial',
          name: 'Lluvia de Indra-Bifrost',
          description: 'Ráfaga devastadora de 5 saetas celestiales que iluminan el firmamento.',
          mpCost: 22,
          weaknessType: 'SWORD',
          hitCount: 5,
          basePower: 22,
          category: 'PHYSICAL',
        },
      },
    ],
    passiveTalents: [
      {
        id: 'archer_pas_hp',
        name: 'Viento de Vayu',
        icon: '🍃',
        description: 'Agilidad del viento que mejora la evasión y resistencia.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { hp: 12, defense: 2 },
      },
      {
        id: 'archer_pas_regen',
        name: 'Concentración de Om',
        icon: '🌌',
        description: 'Enfoca el Prana interior para regenerar maná rápidamente.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { manaRegen: 4, mp: 6 },
      },
      {
        id: 'archer_pas_resist',
        name: 'Aura de Garuda',
        icon: '👤',
        description: 'Manto de plumas celestiales que disipa magias elementales.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { elementalResist: 5 },
      },
      {
        id: 'archer_pas_atk',
        name: 'Flechas de Plata Rúnica',
        icon: '🏹',
        description: 'Aumenta el poder de impacto de los disparos a distancia.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { attack: 3, mp: 4 },
      },
    ],
  },
  mage: {
    id: 'mage',
    name: 'Brahma-Arcanista Rúnico',
    title: 'Sabio de los Mantras y Runas de Yggdrasil',
    icon: '🔮',
    badgeColor: 'from-sky-600 to-indigo-700 text-sky-100 border-sky-400',
    description: 'Canalizador del orden cósmico. Domina mantras sagrados y magias primordiales de Fuego, Hielo de Niflheim y Prana.',
    passiveName: 'Flujo de Prana',
    passiveDescription: '+50 Prana/MP máximos y +30% efectividad en mantras mágicos.',
    statBonuses: {
      attack: 8,
      defense: 4,
      hp: 20,
      mp: 50,
    },
    skills: [
      {
        id: 'tormenta_elemental',
        name: 'Mantra Elemental de Om',
        description: 'Triple descarga arcana de fuego místico e hielo de Niflheim.',
        mpCost: 16,
        weaknessType: 'FIRE',
        hitCount: 3,
        basePower: 24,
        category: 'MAGICAL',
      },
    ],
    talentTree: [
      {
        id: 'mage_t1_meditacion',
        name: 'Meditación Trascendental',
        icon: '🌀',
        description: 'Alinea los chakras con Yggdrasil otorgando +35 Prana/MP máximos.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { mp: 35 },
      },
      {
        id: 'mage_t1_sintonia',
        name: 'Sintonía de las Runas',
        icon: '✨',
        description: 'Aumenta la fuerza mística en +6 Ataque y +15 HP.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { attack: 6, hp: 15 },
      },
      {
        id: 'mage_t2_hielo',
        name: 'Lanza helada de Niflheim',
        icon: '❄️',
        description: 'Desbloquea el conjuro Lanza de Niflheim para congelar enemigos.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['mage_t1_meditacion'],
        skillUnlock: {
          id: 'lanza_hielo',
          name: 'Lanza de Niflheim',
          description: 'Ataque helado de 2 estacas místicas que golpean debilidades de Hielo.',
          mpCost: 12,
          weaknessType: 'ICE',
          hitCount: 2,
          basePower: 28,
          category: 'MAGICAL',
        },
      },
      {
        id: 'mage_t2_concentracion',
        name: 'Visión del Samsara',
        icon: '🧠',
        description: 'Aumenta la reserva de Prana con +40 MP y +5 Ataque.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['mage_t1_sintonia'],
        statBonus: { mp: 40, attack: 5 },
      },
      {
        id: 'mage_t3_incineracion',
        name: 'Incineración de Agni',
        icon: '🔥',
        description: 'Fuego purificador del universo que otorga +12 Ataque.',
        tier: 3,
        reqLevel: 10,
        cost: 1,
        prerequisites: ['mage_t2_hielo'],
        statBonus: { attack: 12 },
      },
      {
        id: 'mage_t4_singularidad',
        name: 'Singularidad de Samsara',
        icon: '🌌',
        description: 'Técnica Definitiva: Cataclismo de 4 olas de Prana y fuego primario.',
        tier: 4,
        reqLevel: 12,
        cost: 2,
        prerequisites: ['mage_t3_incineracion'],
        skillUnlock: {
          id: 'singularidad_arcanum',
          name: 'Singularidad de Samsara',
          description: 'Colapso cósmico de Prana rúnico que desintegra a las fuerzas del caos.',
          mpCost: 24,
          weaknessType: 'FIRE',
          hitCount: 4,
          basePower: 32,
          category: 'MAGICAL',
        },
      },
    ],
    passiveTalents: [
      {
        id: 'mage_pas_hp',
        name: 'Escudo del Rishi',
        icon: '🔮',
        description: 'Conecta la salud vital al equilibrio universal.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { hp: 14 },
      },
      {
        id: 'mage_pas_regen',
        name: 'Ecos de Yggdrasil',
        icon: '🌀',
        description: 'Absorbe la savia sagrada del gran Árbol recuperando Prana masivo.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { manaRegen: 5, mp: 10 },
      },
      {
        id: 'mage_pas_resist',
        name: 'Baluarte de Brahma',
        icon: '❄️',
        description: 'Barrera mística que neutraliza el daño de elementos corrosivos.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { elementalResist: 6, defense: 1 },
      },
      {
        id: 'mage_pas_atk',
        name: 'Mantra de la Creación',
        icon: '✨',
        description: 'Amplifica el poder de la magia ofensiva.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { attack: 4 },
      },
    ],
  },
  paladin: {
    id: 'paladin',
    name: 'Dharma-Einherjar',
    title: 'Escudo Divino de Asgard-Loka y Guardián del Soma',
    icon: '🛡️',
    badgeColor: 'from-amber-500 to-yellow-600 text-amber-950 border-amber-300',
    description: 'Baluarte inquebrantable. Protege el equilibrio sagrado del reino con corazas benditas y el elixir reconfortante del Soma.',
    passiveName: 'Aura de Amrita',
    passiveDescription: '+18 Defensa base y milagros curativos del Soma de Yggdrasil.',
    statBonuses: {
      attack: 10,
      defense: 18,
      hp: 50,
      mp: 25,
    },
    skills: [
      {
        id: 'luz_sagrada',
        name: 'Juicio del Dharma',
        description: 'Impacto radiante que restaura +30 HP a Eldor mediante el Soma Divino.',
        mpCost: 14,
        weaknessType: 'ARCANA',
        hitCount: 2,
        basePower: 22,
        category: 'HEAL',
      },
    ],
    talentTree: [
      {
        id: 'paladin_t1_aura',
        name: 'Aura de Asgard-Loka',
        icon: '🛡️',
        description: 'Escudo del reino que otorga +12 Defensa y +30 HP máximos.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { defense: 12, hp: 30 },
      },
      {
        id: 'paladin_t1_bendicion',
        name: 'Bendición del Soma',
        icon: '✨',
        description: 'Savia sagrada que otorga +25 MP y +6 Ataque.',
        tier: 1,
        reqLevel: 5,
        cost: 1,
        statBonus: { mp: 25, attack: 6 },
      },
      {
        id: 'paladin_t2_escudo',
        name: 'Castigo del Dharma',
        icon: '☀️',
        description: 'Desbloquea la técnica milagrosa de luz sagrada y restauración.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['paladin_t1_aura'],
        skillUnlock: {
          id: 'castigo_luz',
          name: 'Castigo del Dharma',
          description: 'Espada imbuida en luz de los devalokas que golpea debilidades arcanas.',
          mpCost: 14,
          weaknessType: 'ARCANA',
          hitCount: 2,
          basePower: 26,
          category: 'MAGICAL',
        },
      },
      {
        id: 'paladin_t2_muro',
        name: 'Muro del Karma Puro',
        icon: '⛪',
        description: 'Defensa imperturbable que suma +15 Defensa física y +40 HP.',
        tier: 2,
        reqLevel: 7,
        cost: 1,
        prerequisites: ['paladin_t1_bendicion'],
        statBonus: { defense: 15, hp: 40 },
      },
      {
        id: 'paladin_t3_bastion',
        name: 'Bastión del Amrita',
        icon: '👑',
        description: 'Inmortalidad espiritual con +10 Ataque y +10 Defensa.',
        tier: 3,
        reqLevel: 10,
        cost: 1,
        prerequisites: ['paladin_t2_escudo'],
        statBonus: { attack: 10, defense: 10 },
      },
      {
        id: 'paladin_t4_arcangel',
        name: 'Juicio de Vishnu-Odín',
        icon: '⚔️',
        description: 'Técnica Definitiva: 3 estocadas de luz radiante que destierran el caos de Vritra.',
        tier: 4,
        reqLevel: 12,
        cost: 2,
        prerequisites: ['paladin_t3_bastion'],
        skillUnlock: {
          id: 'juicio_arcangel',
          name: 'Juicio de Vishnu-Odín',
          description: 'Ataque sagrado que desata el orden divino celestial sobre el enemigo.',
          mpCost: 22,
          weaknessType: 'ARCANA',
          hitCount: 3,
          basePower: 34,
          category: 'HEAL',
        },
      },
    ],
    passiveTalents: [
      {
        id: 'paladin_pas_hp',
        name: 'Santuario del Soma',
        icon: '☀️',
        description: 'Imbuye el espíritu con la gracia del elixir divino otorgando alta salud.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { hp: 20 },
      },
      {
        id: 'paladin_pas_regen',
        name: 'Mantras de Purificación',
        icon: '🙏',
        description: 'Oración continua que purifica la mente e incrementa la regeneración de Prana.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { manaRegen: 3, mp: 8 },
      },
      {
        id: 'paladin_pas_resist',
        name: 'Escudo de Bifrost-Loka',
        icon: '🛡️',
        description: 'Escudo espiritual que otorga alta resistencia física y mágica.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { defense: 3, elementalResist: 4 },
      },
      {
        id: 'paladin_pas_atk',
        name: 'Luz del Alba Sacra',
        icon: '⚔️',
        description: 'Potencia el impacto sagrado de las armas.',
        maxRanks: 5,
        costPerRank: 1,
        statPerRank: { attack: 3, hp: 5 },
      },
    ],
  },
};

export const DEFAULT_ARCHETYPE_ID = 'novice';

