import { ClaudecraftAssets } from '../Assets/ClaudecraftAssets';

export interface MapLighting {
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: { X: number; Y: number; Z: number };
}

export interface MapObjectSpawn {
  id: string;
  type: string;
  x: number;
  z: number;
}

export interface MapInteractableSpawn {
  id: string;
  type: string;
  x: number;
  z: number;
  message?: string;
}

export interface MapNPCSpawn {
  id: string;
  classId: string;
  name?: string;
  x: number;
  z: number;
  isEnemy?: boolean;
  dialogueId?: string;
}

export interface MapPortalSpawn {
  id: string;
  targetMapId: string;
  targetX: number;
  targetZ: number;
  targetName: string;
  x: number;
  z: number;
  prompt?: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  subtitle: string;
  type: 'village' | 'forest' | 'dungeon' | 'procedural';
  mapArt?: string;
  lighting: MapLighting;
  playerSpawn: { x: number; z: number };
  spawns: {
    objects: MapObjectSpawn[];
    interactables: MapInteractableSpawn[];
    npcs: MapNPCSpawn[];
    portals: MapPortalSpawn[];
  };
}

export const MAP_DEFINITIONS: Record<string, MapDefinition> = {
  village: {
    id: 'village',
    name: 'Santuario de Midgard-Loka',
    subtitle: 'Santuario bendecido por Yggdrasil-Samsara',
    type: 'village',
    mapArt: ClaudecraftAssets.MAP_ART.eastbrook_vale,
    playerSpawn: { x: 0, z: 0 },
    lighting: {
      ambientColor: 0xffffff,
      ambientIntensity: 0.8,
      sunColor: 0xfffaed,
      sunIntensity: 1.4,
      sunPosition: { X: 15, Y: 30, Z: 15 },
    },
    spawns: {
      objects: [
        { id: 'tree_v1', type: 'TREE', x: -8, z: -6 },
        { id: 'tree_v2', type: 'TREE', x: -10, z: -2 },
        { id: 'tree_v3', type: 'TREE', x: 8, z: -8 },
        { id: 'tree_v4', type: 'TREE', x: 10, z: 6 },
        { id: 'rock_v1', type: 'ROCK', x: -4, z: 6 },
        { id: 'rock_v2', type: 'ROCK', x: 6, z: 8 },
        { id: 'column_v1', type: 'COLUMN', x: 12, z: -4 },
        { id: 'statue_v1', type: 'STATUE', x: -2, z: -4 },
        { id: 'lantern_v1', type: 'LANTERN', x: -3, z: -2 },
        { id: 'lantern_v2', type: 'LANTERN', x: 3, z: -2 },
        { id: 'lantern_v3', type: 'LANTERN', x: 0, z: -10 },
        { id: 'lantern_v4', type: 'LANTERN', x: 10, z: 0 },
        { id: 'fence_v1', type: 'FENCE', x: -4, z: -2 },
        { id: 'fence_v2', type: 'FENCE', x: 4, z: -2 },
        { id: 'fence_v3', type: 'FENCE', x: -4, z: 2 },
        { id: 'bush_v1', type: 'BUSH', x: 2, z: -4 },
        { id: 'bush_v2', type: 'BUSH', x: -4, z: -4 },
        { id: 'flower_v1', type: 'FLOWER', x: 0, z: -3 },
        { id: 'flower_v2', type: 'FLOWER', x: -3, z: 3 },
        { id: 'flower_v3', type: 'FLOWER', x: 3, z: 3 },
        { id: 'barrel_v1', type: 'BARREL', x: -6, z: 3 },
        { id: 'barrel_v2', type: 'BARREL', x: -6, z: 1 },
        { id: 'arch_forest_portal', type: 'ARCH', x: 0, z: -14 },
        { id: 'arch_dungeon_portal', type: 'ARCH', x: 14, z: 0 },
        { id: 'sign_forest', type: 'SIGN', x: -2, z: -12 },
        { id: 'sign_dungeon', type: 'SIGN', x: 12, z: -2 },
      ],
      interactables: [
        { id: 'chest_village', type: 'CHEST', x: 4, z: -4, message: '¡Has abierto el cofre del Santuario del Soma!' },
        { id: 'save_crystal_village', type: 'SAVE_POINT', x: -2, z: -2, message: 'Cristal Pránico de Midgard-Loka' },
      ],
      npcs: [
        { id: 'guard_npc', classId: 'knight_armor', name: 'Guardián Kshatriya', x: 2, z: 2, dialogueId: 'royal_guard_talk' },
        { id: 'merchant_npc', classId: 'hero_adventurer', name: 'Mercader del Soma', x: -5, z: 2, dialogueId: 'merchant_talk' },
        { id: 'oldman_npc', classId: 'knight_armor', name: 'Sabio Rishis de las Nornas', x: 0, z: 5, dialogueId: 'old_man_intro' },
        { id: 'slime_dummy', classId: 'slime_enemy', name: 'Limo de Vritra', x: -8, z: 8, isEnemy: true },
      ],
      portals: [
        {
          id: 'portal_village_to_forest',
          targetMapId: 'forest',
          targetX: 0,
          targetZ: 9,
          targetName: 'Bosque de Asgard-Samsara',
          x: 0,
          z: -14,
          prompt: 'Entrar al Bosque de Asgard-Samsara',
        },
        {
          id: 'portal_village_to_dungeon',
          targetMapId: 'dungeon',
          targetX: -12,
          targetZ: 8,
          targetName: 'Abismo de Niflheim-Vritra',
          x: 14,
          z: 0,
          prompt: 'Descender al Abismo de Niflheim',
        },
        {
          id: 'portal_village_to_procedural',
          targetMapId: 'procedural',
          targetX: 0,
          targetZ: 0,
          targetName: 'Wilderness Procedimental (OpenSimplex / fBm)',
          x: -14,
          z: 0,
          prompt: 'Viajar a las Tierras Infinitas (Procedural Engine)',
        },
      ],
    },
  },

  forest: {
    id: 'forest',
    name: 'Bosque de Asgard-Samsara',
    subtitle: 'Bosque místico de las Nornas y espíritus de Prana',
    type: 'forest',
    mapArt: ClaudecraftAssets.MAP_ART.mirefen_marsh,
    playerSpawn: { x: 0, z: 9 },
    lighting: {
      ambientColor: 0x99e6b3,
      ambientIntensity: 0.9,
      sunColor: 0xe6ffed,
      sunIntensity: 1.2,
      sunPosition: { X: -10, Y: 25, Z: -10 },
    },
    spawns: {
      objects: [
        { id: 'f_tree_1', type: 'TREE', x: -12, z: -12 },
        { id: 'f_tree_2', type: 'TREE', x: -14, z: -6 },
        { id: 'f_tree_3', type: 'TREE', x: -10, z: 0 },
        { id: 'f_tree_4', type: 'TREE', x: -12, z: 8 },
        { id: 'f_tree_5', type: 'TREE', x: 12, z: 12 },
        { id: 'f_tree_6', type: 'TREE', x: 14, z: 4 },
        { id: 'f_tree_7', type: 'TREE', x: 10, z: -4 },
        { id: 'f_tree_8', type: 'TREE', x: 4, z: 10 },
        { id: 'f_rock_1', type: 'ROCK', x: -6, z: -8 },
        { id: 'f_rock_2', type: 'ROCK', x: 8, z: 6 },
        { id: 'f_rock_3', type: 'ROCK', x: -2, z: -10 },
        { id: 'f_fountain', type: 'FOUNTAIN', x: -6, z: 6 },
        { id: 'f_bridge_1', type: 'BRIDGE', x: -6, z: 2 },
        { id: 'f_mush_1', type: 'MUSHROOM', x: -8, z: 4 },
        { id: 'f_mush_2', type: 'MUSHROOM', x: 2, z: 6 },
        { id: 'f_mush_3', type: 'MUSHROOM', x: 8, z: -2 },
        { id: 'f_ruin_1', type: 'RUIN', x: 4, z: -2 },
        { id: 'f_ruin_2', type: 'RUIN', x: -2, z: -6 },
        { id: 'f_crystal_1', type: 'CRYSTAL', x: -8, z: 6 },
        { id: 'f_crystal_2', type: 'CRYSTAL', x: -4, z: 6 },
        { id: 'f_bush_1', type: 'BUSH', x: -4, z: 8 },
        { id: 'f_bush_2', type: 'BUSH', x: 2, z: -6 },
        { id: 'f_bush_3', type: 'BUSH', x: 6, z: 8 },
        { id: 'f_flower_1', type: 'FLOWER', x: -6, z: 4 },
        { id: 'f_flower_2', type: 'FLOWER', x: -2, z: -4 },
        { id: 'f_flower_3', type: 'FLOWER', x: 4, z: 4 },
        { id: 'f_arch_dungeon', type: 'ARCH', x: 12, z: -12 },
        { id: 'f_arch_village', type: 'ARCH', x: 0, z: 14 },
        { id: 'f_sign_village', type: 'SIGN', x: -2, z: 12 },
        { id: 'f_sign_dungeon', type: 'SIGN', x: 10, z: -10 },
      ],
      interactables: [
        { id: 'chest_forest_hidden', type: 'CHEST', x: -10, z: -10, message: '¡Cofre de reliquias de Asgard abierto!' },
        { id: 'save_forest_sanctuary', type: 'SAVE_POINT', x: -6, z: 8, message: 'Altar del Prana Sagrado' },
      ],
      npcs: [
        { id: 'explorer_elian', classId: 'hero_adventurer', name: 'Limo de Prana', x: -2, z: 4, dialogueId: 'friendly_slime' },
        { id: 'wild_slime_1', classId: 'slime_enemy', name: 'Siervo de Vritra', x: -6, z: -4, isEnemy: true },
        { id: 'wild_slime_2', classId: 'slime_enemy', name: 'Huargo Fenrir-Rakshasa', x: 6, z: 2, isEnemy: true },
        { id: 'forest_goblin', classId: 'slime_enemy', name: 'Guerrero Asura-Dvergr', x: 4, z: -8, isEnemy: true },
        { id: 'shadow_bandit', classId: 'knight_armor', name: 'Guardián Corrupto de Niflheim', x: -8, z: -2, isEnemy: true },
      ],
      portals: [
        {
          id: 'portal_forest_to_village',
          targetMapId: 'village',
          targetX: 0,
          targetZ: -9,
          targetName: 'Santuario de Midgard-Loka',
          x: 0,
          z: 14,
          prompt: 'Regresar a Midgard-Loka',
        },
        {
          id: 'portal_forest_to_dungeon',
          targetMapId: 'dungeon',
          targetX: -12,
          targetZ: 8,
          targetName: 'Abismo de Niflheim-Vritra',
          x: 12,
          z: -12,
          prompt: 'Entrar al Abismo de Niflheim',
        },
      ],
    },
  },

  dungeon: {
    id: 'dungeon',
    name: 'Abismo de Niflheim-Vritra',
    subtitle: 'El Laberinto del Dragón Serpentino del Caos',
    type: 'dungeon',
    mapArt: ClaudecraftAssets.MAP_ART.veiled_hollow,
    playerSpawn: { x: -12, z: 8 },
    lighting: {
      ambientColor: 0x4a3b63,
      ambientIntensity: 0.5,
      sunColor: 0xff8833,
      sunIntensity: 0.6,
      sunPosition: { X: 0, Y: 15, Z: 0 },
    },
    spawns: {
      objects: [
        // --- SALÓN 1: ENTRADA (-12, 12) ---
        { id: 'd_torch_e1', type: 'TORCH', x: -14, z: 10 },
        { id: 'd_torch_e2', type: 'TORCH', x: -10, z: 10 },
        { id: 'd_sign_warning', type: 'SIGN', x: -12, z: 10 },

        // --- SALÓN 2: PASILLOS Y LABERINTO ---
        // Paredes del laberinto (Bloques que forman los salones)
        // Salón de Entrada
        { id: 'w_e1', type: 'WALL', x: -14, z: 14 },
        { id: 'w_e2', type: 'WALL', x: -10, z: 14 },
        { id: 'w_e3', type: 'WALL', x: -8, z: 12 },
        { id: 'w_e4', type: 'WALL', x: -8, z: 10 },
        { id: 'w_e5', type: 'WALL', x: -8, z: 8 },

        // Pasillo Central
        { id: 'w_p1', type: 'WALL', x: -12, z: 6 },
        { id: 'w_p2', type: 'WALL', x: -10, z: 6 },
        { id: 'w_p3', type: 'WALL', x: -6, z: 6 },
        { id: 'w_p4', type: 'WALL', x: -4, z: 6 },
        { id: 'w_p5', type: 'WALL', x: -2, z: 6 },
        { id: 'w_p6', type: 'WALL', x: 0, z: 6 },
        { id: 'w_p7', type: 'WALL', x: 2, z: 6 },
        { id: 'w_p8', type: 'WALL', x: 4, z: 6 },

        // División entre Salón 3 (Tesoro) y Salón 5 (Jefe)
        { id: 'w_t1', type: 'WALL', x: 6, z: -4 },
        { id: 'w_t2', type: 'WALL', x: 6, z: -6 },
        { id: 'w_t3', type: 'WALL', x: 6, z: -8 },
        { id: 'w_t4', type: 'WALL', x: 6, z: -12 },
        { id: 'w_t5', type: 'WALL', x: 6, z: -14 },

        // Columnas ornamentales en los salones
        { id: 'd_col_1', type: 'COLUMN', x: 8, z: -8 },
        { id: 'd_col_2', type: 'COLUMN', x: 12, z: -8 },
        { id: 'd_col_b1', type: 'COLUMN', x: -2, z: -10 },
        { id: 'd_col_b2', type: 'COLUMN', x: 2, z: -10 },
        { id: 'd_col_b3', type: 'COLUMN', x: -2, z: -14 },
        { id: 'd_col_b4', type: 'COLUMN', x: 2, z: -14 },

        // Antorchas y braseros encendidos en las salas
        { id: 'd_brazier_entry', type: 'BRAZIER', x: -10, z: 8 },
        { id: 'd_brazier_hall1', type: 'BRAZIER', x: 0, z: -6 },
        { id: 'd_brazier_hall2', type: 'BRAZIER', x: 10, z: -6 },
        { id: 'd_ruin_1', type: 'RUIN', x: -4, z: 0 },
        { id: 'd_ruin_2', type: 'RUIN', x: 4, z: -2 },
        { id: 'd_torch_b1', type: 'TORCH', x: -4, z: -12 },
        { id: 'd_torch_b2', type: 'TORCH', x: 4, z: -12 },
        { id: 'd_torch_treas1', type: 'TORCH', x: 8, z: -12 },
        { id: 'd_torch_sanct1', type: 'TORCH', x: -8, z: -8 },

        // Altar del Santuario
        { id: 'd_fountain_sanct', type: 'FOUNTAIN', x: -10, z: -10 },
        { id: 'd_statue_boss_1', type: 'STATUE', x: -3, z: -15 },
        { id: 'd_statue_boss_2', type: 'STATUE', x: 3, z: -15 },
        { id: 'd_crystal_void1', type: 'CRYSTAL', x: -6, z: -14 },
        { id: 'd_crystal_void2', type: 'CRYSTAL', x: 6, z: -14 },
        { id: 'd_arch_boss_gate', type: 'ARCH', x: 0, z: -8 },
        { id: 'd_arch_exit', type: 'ARCH', x: -12, z: 14 },
      ],
      interactables: [
        // Cofre del Tesoro en Salón 3
        { id: 'chest_dungeon_master', type: 'CHEST', x: 10, z: -12, message: '¡Has abierto el Relicario del Soma en el Abismo!' },
        // Cofre Real tras vencer al Jefe
        { id: 'chest_dungeon_boss', type: 'CHEST', x: 0, z: -15, message: '¡Has reclamado la Esencia del Dharma Sagrado!' },
        // Punto de Guardado en el Santuario
        { id: 'save_dungeon_sanctuary', type: 'SAVE_POINT', x: -12, z: -10, message: 'Faro Pránico de Niflheim' },
      ],
      npcs: [
        // Guardias y Monstruos en el laberinto
        { id: 'dungeon_guard_1', classId: 'slime_enemy', name: 'Limo de Vritra', x: -6, z: 2, isEnemy: true },
        { id: 'dungeon_guard_2', classId: 'slime_enemy', name: 'Huargo Fenrir-Rakshasa', x: 2, z: 2, isEnemy: true },
        { id: 'dungeon_skeleton_1', classId: 'knight_armor', name: 'Guerrero Asura-Dvergr', x: 8, z: -6, isEnemy: true },
        { id: 'dungeon_skeleton_2', classId: 'knight_armor', name: 'Guardián de la Sombra de Vritra', x: 12, z: -10, isEnemy: true },

        // EL JEFE DE LA MAZMORRA EN EL SALÓN DEL TRONO
        { id: 'dungeon_boss_king', classId: 'slime_enemy', name: 'AVATAR DE VRITRA-NIDHOGG (JEFE)', x: 0, z: -12, isEnemy: true },
      ],
      portals: [
        {
          id: 'portal_dungeon_to_village',
          targetMapId: 'village',
          targetX: 9,
          targetZ: 0,
          targetName: 'Santuario de Midgard-Loka',
          x: -12,
          z: 14,
          prompt: 'Escapar a Midgard-Loka',
        },
      ],
    },
  },

  procedural: {
    id: 'procedural',
    name: 'Mundo Procedimental Infinito',
    subtitle: 'Motor OpenSimplex + fBm 6-Octavas + Scatter de InstancedMesh + Streaming Chunks',
    type: 'procedural',
    mapArt: ClaudecraftAssets.MAP_ART.eastbrook_vale,
    playerSpawn: { x: 0, z: 0 },
    lighting: {
      ambientColor: 0xffffff,
      ambientIntensity: 0.85,
      sunColor: 0xfffaed,
      sunIntensity: 1.4,
      sunPosition: { X: 20, Y: 40, Z: 20 },
    },
    spawns: {
      objects: [],
      interactables: [
        { id: 'save_procedural', type: 'SAVE_POINT', x: 2, z: 2, message: 'Nexo Pránico del Infinito' },
        { id: 'chest_procedural', type: 'CHEST', x: -2, z: 2, message: '¡Reliquia Procedimental Encontrada!' },
      ],
      npcs: [
        { id: 'explorador_procedural', classId: 'hero_adventurer', name: 'Explorador del Caos', x: 0, z: 3, dialogueId: 'merchant_talk' },
      ],
      portals: [
        {
          id: 'portal_procedural_to_village',
          targetMapId: 'village',
          targetX: -14,
          targetZ: 0,
          targetName: 'Santuario de Midgard-Loka',
          x: 0,
          z: -4,
          prompt: 'Regresar a Midgard-Loka',
        },
      ],
    },
  },
};
