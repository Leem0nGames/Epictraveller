/**
 * Claudecraft CDN Asset Directory
 * Maps game resources to high-resolution assets hosted on jsDelivr CDN
 * Repo: levy-street/world-of-claudecraft
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/levy-street/world-of-claudecraft@main/public';

export const ClaudecraftAssets = {
  // --- CURRENCY & GENERAL RPG ICONS ---
  COIN: `${CDN_BASE}/claudium/icons/claudium_coin.webp`,
  COIN_STACK: `${CDN_BASE}/claudium/icons/stack_small.webp`,
  TREASURE_CHEST: `${CDN_BASE}/ui/daily-rewards/treasure_chest.webp`,
  BAGS: `${CDN_BASE}/ui/chrome/bags.webp`,

  // --- SKILL / SPELL ICONS ---
  SKILLS: {
    fireball: `${CDN_BASE}/ui/skills/mage/fireball.webp`,
    flame_burst: `${CDN_BASE}/ui/skills/mage/fireball.webp`,
    frostbolt: `${CDN_BASE}/ui/skills/mage/frostbolt.webp`,
    astral_icicle: `${CDN_BASE}/ui/skills/mage/frostbolt.webp`,
    blink: `${CDN_BASE}/ui/skills/mage/blink.webp`,
    arcane_intellect: `${CDN_BASE}/ui/skills/mage/arcane_intellect.webp`,
    exceed_nova: `${CDN_BASE}/ui/skills/mage/arcane_intellect.webp`,
    barkskin: `${CDN_BASE}/ui/skills/druid/barkskin.webp`,
    healing_touch: `${CDN_BASE}/ui/skills/druid/healing_touch.webp`,
    curative_light: `${CDN_BASE}/ui/skills/druid/healing_touch.webp`,
    moonfire: `${CDN_BASE}/ui/skills/druid/moonfire.webp`,
    aimed_shot: `${CDN_BASE}/ui/skills/hunter/aimed_shot.webp`,
    triple_slash: `${CDN_BASE}/ui/items/ashwood_axe.webp`,
    serpent_sting: `${CDN_BASE}/ui/skills/hunter/serpent_sting.webp`,
  } as Record<string, string>,

  // --- ITEM / EQUIPMENT ICONS ---
  ITEMS: {
    iron_sword: `${CDN_BASE}/ui/items/ashwood_axe.webp`,
    crystal_shield: `${CDN_BASE}/ui/items/bonewrought_bulwark.webp`,
    ruby_ring: `${CDN_BASE}/ui/items/ashen_focus_ring.webp`,
    legendary_staff: `${CDN_BASE}/ui/items/apprentice_robe.webp`,
    small_potion: `${CDN_BASE}/ui/items/conjured_water.webp`,
    greater_potion: `${CDN_BASE}/ui/items/conjured_water3.webp`,
    mana_elixir: `${CDN_BASE}/ui/items/arcane_dust.webp`,
    baked_bread: `${CDN_BASE}/ui/items/baked_bread.webp`,
    arcanite_bar: `${CDN_BASE}/ui/items/arcanite_bar.webp`,
    arcanite_pick: `${CDN_BASE}/ui/items/arcanite_mining_pick.webp`,
    backpack: `${CDN_BASE}/ui/items/backpack.webp`,
  } as Record<string, string>,

  // Helpers
  getSkillIcon(id: string): string {
    const key = id.toLowerCase();
    if (this.SKILLS[key]) return this.SKILLS[key];
    if (key.includes('fire') || key.includes('flame') || key.includes('fuego')) return this.SKILLS.fireball;
    if (key.includes('frost') || key.includes('ice') || key.includes('hielo')) return this.SKILLS.frostbolt;
    if (key.includes('heal') || key.includes('curat') || key.includes('luz')) return this.SKILLS.healing_touch;
    if (key.includes('slash') || key.includes('tajo') || key.includes('corte')) return this.SKILLS.triple_slash;
    return this.SKILLS.arcane_intellect;
  },

  getItemIcon(id: string): string {
    const key = id.toLowerCase();
    if (this.ITEMS[key]) return this.ITEMS[key];
    if (key.includes('sword') || key.includes('axe') || key.includes('espada') || key.includes('hacha')) return this.ITEMS.iron_sword;
    if (key.includes('shield') || key.includes('escudo') || key.includes('bulwark')) return this.ITEMS.crystal_shield;
    if (key.includes('ring') || key.includes('anillo') || key.includes('jewel')) return this.ITEMS.ruby_ring;
    if (key.includes('staff') || key.includes('robe') || key.includes('baculo') || key.includes('tunica')) return this.ITEMS.legendary_staff;
    if (key.includes('potion') || key.includes('pocion') || key.includes('agua')) return this.ITEMS.small_potion;
    if (key.includes('elixir') || key.includes('mana') || key.includes('dust')) return this.ITEMS.mana_elixir;
    return this.ITEMS.baked_bread;
  },

  // --- MAP ART / WORLD OVERVIEWS ---
  MAP_ART: {
    world_overview: `${CDN_BASE}/map_art/world_overview.webp`,
    eastbrook_vale: `${CDN_BASE}/map_art/eastbrook_vale.png`,
    mirefen_marsh: `${CDN_BASE}/map_art/mirefen_marsh.png`,
    veiled_hollow: `${CDN_BASE}/map_art/veiled_hollow.png`,
    frostveil: `${CDN_BASE}/map_art/frostveil.png`,
    drakelands: `${CDN_BASE}/map_art/drakelands.png`,
  },

  // --- TERRAIN & ENVIRONMENT TEXTURES ---
  TERRAIN: {
    grass_color: `${CDN_BASE}/textures/terrain/Grass001_Color.jpg`,
    grass_normal: `${CDN_BASE}/textures/terrain/Grass001_NormalGL.jpg`,
    grass_roughness: `${CDN_BASE}/textures/terrain/Grass001_Roughness.jpg`,
    stone_color: `${CDN_BASE}/textures/terrain/PavingStones046_Color.jpg`,
    stone_normal: `${CDN_BASE}/textures/terrain/PavingStones046_NormalGL.jpg`,
    stone_roughness: `${CDN_BASE}/textures/terrain/PavingStones046_Roughness.jpg`,
    dirt_color: `${CDN_BASE}/textures/terrain/Ground071_Color.jpg`,
    dirt_normal: `${CDN_BASE}/textures/terrain/Ground071_NormalGL.jpg`,
    rock_color: `${CDN_BASE}/textures/terrain/Rock051_Color.jpg`,
    snow_color: `${CDN_BASE}/textures/terrain/Snow010A_Color.jpg`,
    lava_color: `${CDN_BASE}/textures/terrain/Lava004_Color.jpg`,
    water_normals: `${CDN_BASE}/textures/water/waternormals.jpg`,
  },

  // --- 3D GLB MODELS ---
  MODELS: {
    // Trees & Foliage
    pine_1: `${CDN_BASE}/models/foliage/pine_1.glb`,
    pine_2: `${CDN_BASE}/models/foliage/pine_2.glb`,
    oak_1: `${CDN_BASE}/models/foliage/oak_1.glb`,
    oak_2: `${CDN_BASE}/models/foliage/oak_2.glb`,
    bush: `${CDN_BASE}/models/foliage/bush.glb`,
    bush_flowers: `${CDN_BASE}/models/foliage/bush_flowers.glb`,
    fern: `${CDN_BASE}/models/foliage/fern.glb`,
    rock_1: `${CDN_BASE}/models/foliage/rock_1.glb`,
    rock_2: `${CDN_BASE}/models/foliage/rock_2.glb`,
    mushroom: `${CDN_BASE}/models/foliage/mushroom.glb`,

    // Props & Architecture
    column: `${CDN_BASE}/models/props/column.glb`,
    column_broken: `${CDN_BASE}/models/props/column_broken.glb`,
    garden_arch: `${CDN_BASE}/models/props/garden_arch.glb`,
    fence: `${CDN_BASE}/models/props/fence.glb`,
    garden_iron_fence: `${CDN_BASE}/models/props/garden_iron_fence.glb`,
    well: `${CDN_BASE}/models/props/well.glb`,
    house_1: `${CDN_BASE}/models/props/house_1.glb`,
    house_2: `${CDN_BASE}/models/props/house_2.glb`,
    barrel: `${CDN_BASE}/models/props/barrel.glb`,
    crate_wooden: `${CDN_BASE}/models/props/crate_wooden.glb`,
    banker_chest: `${CDN_BASE}/models/props/banker_chest.glb`,
    bonfire: `${CDN_BASE}/models/props/bonfire.glb`,
    yumi_brazier_stand: `${CDN_BASE}/models/props/yumi_brazier_stand.glb`,
    lantern_wall: `${CDN_BASE}/models/props/lantern_wall.glb`,
    golden_horse_statue: `${CDN_BASE}/models/props/golden_horse_statue.glb`,
    crystal_amethyst: `${CDN_BASE}/models/props/crystal_amethyst_cluster.glb`,
    star_heart_crystal: `${CDN_BASE}/models/props/star_heart_crystal.glb`,
    flower_bed_round: `${CDN_BASE}/models/props/flower_bed_round.glb`,
    flower_glow: `${CDN_BASE}/models/props/flower_glow.glb`,
    eastbrook_noticeboard: `${CDN_BASE}/models/props/eastbrook_noticeboard.glb`,
    eastbrook_bank: `${CDN_BASE}/models/props/eastbrook_bank.glb`,
    eastbrook_inn: `${CDN_BASE}/models/props/eastbrook_inn.glb`,
    eastbrook_smithy: `${CDN_BASE}/models/props/eastbrook_smithy.glb`,

    // Biomes & Dungeon
    beach_chest: `${CDN_BASE}/models/biome/beach_chest.glb`,
    beach_palm_1: `${CDN_BASE}/models/biome/beach_palm_1.glb`,
    beach_barrel: `${CDN_BASE}/models/biome/beach_barrel.glb`,
    camp_fire_pit: `${CDN_BASE}/models/biome/camp_fire_pit.glb`,
    camp_signpost: `${CDN_BASE}/models/biome/camp_signpost.glb`,
    cave_entrance: `${CDN_BASE}/models/biome/cave_entrance.glb`,
    city_arch: `${CDN_BASE}/models/biome/city_arch.glb`,
    city_fence_wood: `${CDN_BASE}/models/biome/city_fence_wood.glb`,
    city_fence_metal: `${CDN_BASE}/models/biome/city_fence_metal.glb`,
    dungeon_arch_stone: `${CDN_BASE}/models/biome/dungeon_arch_stone.glb`,
    dungeon_banner: `${CDN_BASE}/models/biome/dungeon_banner.glb`,
    dungeon_chest: `${CDN_BASE}/models/biome/dungeon_chest.glb`,
    dungeon_column_small: `${CDN_BASE}/models/biome/dungeon_column_small.glb`,
    dungeon_statue_horse: `${CDN_BASE}/models/biome/dungeon_statue_horse.glb`,
    desert_boulder_1: `${CDN_BASE}/models/biome/desert_boulder_1.glb`,
    kcas_column: `${CDN_BASE}/models/biome/kcas_column.glb`,
    kcas_pillar: `${CDN_BASE}/models/biome/kcas_pillar.glb`,
    kcas_torch: `${CDN_BASE}/models/biome/kcas_torch.glb`,
    kcas_wall: `${CDN_BASE}/models/biome/kcas_wall.glb`,
    hex_well: `${CDN_BASE}/models/biome/hex_well.glb`,
  },

  // --- AUDIO MUSIC & SFX ---
  AUDIO: {
    music_main_theme: `${CDN_BASE}/audio/music/main-theme.mp3`,
    music_town_eastbrook: `${CDN_BASE}/audio/music/town_eastbrook.mp3`,
    music_dungeon_crypt: `${CDN_BASE}/audio/music/dungeon_hollow_crypt.mp3`,
    music_combat: `${CDN_BASE}/audio/music/combat_1.mp3`,
    sfx_cast_fire: `${CDN_BASE}/audio/sfx/cast_fire.mp3`,
    sfx_impact_fire: `${CDN_BASE}/audio/sfx/impact_fire.mp3`,
    sfx_heal_impact: `${CDN_BASE}/audio/sfx/heal_impact.mp3`,
    sfx_combat_crit: `${CDN_BASE}/audio/sfx/combat_crit_1.mp3`,
    sfx_amb_birds: `${CDN_BASE}/audio/sfx/amb_birds.mp3`,
  },
};
