import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type VillagePropType =
  | 'v_house_small'
  | 'v_house_medium'
  | 'v_inn'
  | 'v_bank'
  | 'v_smithy'
  | 'v_watchtower'
  | 'v_well'
  | 'v_cobblestone_tile'
  | 'v_fence_straight'
  | 'v_fence_corner'
  | 'v_streetlamp'
  | 'v_bench'
  | 'v_table'
  | 'v_barrel_stack'
  | 'v_crate_stack'
  | 'v_noticeboard'
  | 'v_bonfire'
  | 'v_cart'
  | 'v_city_arch'
  | 'v_chest'
  | 'v_flower_bed'
  | 'v_statue'
  | 'v_wall_straight'
  | 'v_wall_tower'
  | 'v_wall_gate';

export interface VillageAssetPackage {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export class VillageGeometryFactory {
  private static cache = new Map<VillagePropType, VillageAssetPackage>();

  /**
   * Retrieves or builds a composite single-draw-call BufferGeometry and Material
   * for a specific village prop type, optimized for THREE.InstancedMesh.
   */
  public static getAsset(type: VillagePropType): VillageAssetPackage {
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    let pkg: VillageAssetPackage;

    switch (type) {
      case 'v_cobblestone_tile':
        pkg = this.createCobblestoneTile();
        break;
      case 'v_house_small':
        pkg = this.createHouseSmall();
        break;
      case 'v_house_medium':
      case 'v_inn':
      case 'v_bank':
      case 'v_smithy':
        pkg = this.createHouseMedium();
        break;
      case 'v_watchtower':
      case 'v_city_arch':
      case 'v_statue':
        pkg = this.createWatchtower();
        break;
      case 'v_chest':
      case 'v_flower_bed':
        pkg = this.createCrateStack();
        break;
      case 'v_well':
        pkg = this.createWell();
        break;
      case 'v_fence_straight':
        pkg = this.createFenceStraight();
        break;
      case 'v_fence_corner':
        pkg = this.createFenceCorner();
        break;
      case 'v_streetlamp':
        pkg = this.createStreetlamp();
        break;
      case 'v_bench':
        pkg = this.createBench();
        break;
      case 'v_table':
        pkg = this.createTable();
        break;
      case 'v_barrel_stack':
        pkg = this.createBarrelStack();
        break;
      case 'v_crate_stack':
        pkg = this.createCrateStack();
        break;
      case 'v_noticeboard':
        pkg = this.createNoticeboard();
        break;
      case 'v_bonfire':
        pkg = this.createBonfire();
        break;
      case 'v_cart':
        pkg = this.createCart();
        break;
      case 'v_wall_straight':
        pkg = this.createWallStraight();
        break;
      case 'v_wall_tower':
        pkg = this.createWallTower();
        break;
      case 'v_wall_gate':
        pkg = this.createWallGate();
        break;
      default:
        pkg = this.createCobblestoneTile();
        break;
    }

    this.cache.set(type, pkg);
    return pkg;
  }

  // --- COBBLESTONE TILE ---
  private static createCobblestoneTile(): VillageAssetPackage {
    const geo = new THREE.BoxGeometry(2.4, 0.08, 2.4);
    // Add vertex colors for subtle stone variation
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const v = 0.45 + Math.sin(i * 1.7) * 0.08;
      colors[i * 3] = v + 0.05;     // slight warmth
      colors[i * 3 + 1] = v;
      colors[i * 3 + 2] = v - 0.02;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
    });
    return { geometry: geo, material: mat };
  }

  // --- HOUSE SMALL ---
  private static createHouseSmall(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // 1. Stone Foundation
    const base = new THREE.BoxGeometry(3.2, 0.8, 3.2);
    base.translate(0, 0.4, 0);
    this.applyColorToGeometry(base, new THREE.Color(0x64748b)); // Stone gray
    geometries.push(base);

    // 2. Plaster Walls
    const walls = new THREE.BoxGeometry(3.0, 2.0, 3.0);
    walls.translate(0, 1.8, 0);
    this.applyColorToGeometry(walls, new THREE.Color(0xe2e8f0)); // Cream plaster
    geometries.push(walls);

    // 3. Timber Framing Accents
    const timberCorner1 = new THREE.BoxGeometry(0.2, 2.0, 0.2);
    timberCorner1.translate(1.45, 1.8, 1.45);
    this.applyColorToGeometry(timberCorner1, new THREE.Color(0x523318));
    geometries.push(timberCorner1);

    const timberCorner2 = timberCorner1.clone();
    timberCorner2.translate(-2.9, 0, 0);
    geometries.push(timberCorner2);

    const timberCorner3 = timberCorner1.clone();
    timberCorner3.translate(0, 0, -2.9);
    geometries.push(timberCorner3);

    const timberCorner4 = timberCorner1.clone();
    timberCorner4.translate(-2.9, 0, -2.9);
    geometries.push(timberCorner4);

    // 4. Pitched Wooden Roof
    const roof = new THREE.ConeGeometry(2.6, 1.8, 4);
    roof.rotateY(Math.PI / 4);
    roof.scale(1.1, 1.0, 1.1);
    roof.translate(0, 3.7, 0);
    this.applyColorToGeometry(roof, new THREE.Color(0x78350f)); // Dark thatch/wood
    geometries.push(roof);

    // 5. Wooden Door
    const door = new THREE.BoxGeometry(0.8, 1.4, 0.1);
    door.translate(0, 1.5, 1.52);
    this.applyColorToGeometry(door, new THREE.Color(0x451a03));
    geometries.push(door);

    // 6. Chimney
    const chimney = new THREE.BoxGeometry(0.5, 2.2, 0.5);
    chimney.translate(1.1, 3.2, -0.8);
    this.applyColorToGeometry(chimney, new THREE.Color(0x475569));
    geometries.push(chimney);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
    });
    return { geometry: merged, material: mat };
  }

  // --- HOUSE MEDIUM (2-Story Timber) ---
  private static createHouseMedium(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Ground Floor Stone
    const ground = new THREE.BoxGeometry(4.2, 2.2, 4.2);
    ground.translate(0, 1.1, 0);
    this.applyColorToGeometry(ground, new THREE.Color(0x475569));
    geometries.push(ground);

    // Second Floor Timber Frame
    const second = new THREE.BoxGeometry(4.5, 2.2, 4.5);
    second.translate(0, 3.3, 0);
    this.applyColorToGeometry(second, new THREE.Color(0xfef3c7)); // Warm cream
    geometries.push(second);

    // Roof
    const roof = new THREE.ConeGeometry(3.6, 2.2, 4);
    roof.rotateY(Math.PI / 4);
    roof.translate(0, 5.5, 0);
    this.applyColorToGeometry(roof, new THREE.Color(0x991b1b)); // Crimson tiles
    geometries.push(roof);

    // Door & Porch Steps
    const steps = new THREE.BoxGeometry(1.4, 0.3, 0.8);
    steps.translate(0, 0.15, 2.4);
    this.applyColorToGeometry(steps, new THREE.Color(0x334155));
    geometries.push(steps);

    const door = new THREE.BoxGeometry(1.0, 1.6, 0.1);
    door.translate(0, 1.1, 2.12);
    this.applyColorToGeometry(door, new THREE.Color(0x3b1a0e));
    geometries.push(door);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
    });
    return { geometry: merged, material: mat };
  }

  // --- WATCHTOWER ---
  private static createWatchtower(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Stone Tower Shaft
    const shaft = new THREE.CylinderGeometry(1.3, 1.6, 6.5, 8);
    shaft.translate(0, 3.25, 0);
    this.applyColorToGeometry(shaft, new THREE.Color(0x475569));
    geometries.push(shaft);

    // Wooden Parapet Balcony
    const balcony = new THREE.CylinderGeometry(1.8, 1.5, 1.0, 8);
    balcony.translate(0, 6.8, 0);
    this.applyColorToGeometry(balcony, new THREE.Color(0x78350f));
    geometries.push(balcony);

    // Conical Roof
    const roof = new THREE.ConeGeometry(2.0, 2.2, 8);
    roof.translate(0, 8.4, 0);
    this.applyColorToGeometry(roof, new THREE.Color(0x1e293b)); // Dark slate
    geometries.push(roof);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
    });
    return { geometry: merged, material: mat };
  }

  // --- TOWN WELL ---
  private static createWell(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Stone Basin
    const basin = new THREE.CylinderGeometry(1.0, 1.1, 0.9, 8);
    basin.translate(0, 0.45, 0);
    this.applyColorToGeometry(basin, new THREE.Color(0x64748b));
    geometries.push(basin);

    // Water Inside
    const water = new THREE.CylinderGeometry(0.85, 0.85, 0.1, 8);
    water.translate(0, 0.75, 0);
    this.applyColorToGeometry(water, new THREE.Color(0x0284c7)); // Deep blue water
    geometries.push(water);

    // Wooden Posts
    const post1 = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
    post1.translate(-0.8, 1.5, 0);
    this.applyColorToGeometry(post1, new THREE.Color(0x523318));
    geometries.push(post1);

    const post2 = post1.clone();
    post2.translate(1.6, 0, 0);
    geometries.push(post2);

    // Roof Canopy
    const roof = new THREE.ConeGeometry(1.3, 0.8, 4);
    roof.rotateY(Math.PI / 4);
    roof.translate(0, 2.8, 0);
    this.applyColorToGeometry(roof, new THREE.Color(0x92400e));
    geometries.push(roof);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
    });
    return { geometry: merged, material: mat };
  }

  // --- FENCE STRAIGHT ---
  private static createFenceStraight(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Post 1
    const post1 = new THREE.BoxGeometry(0.16, 1.1, 0.16);
    post1.translate(-0.9, 0.55, 0);
    this.applyColorToGeometry(post1, new THREE.Color(0x78350f));
    geometries.push(post1);

    // Post 2
    const post2 = post1.clone();
    post2.translate(1.8, 0, 0);
    geometries.push(post2);

    // Rail Top
    const rail1 = new THREE.BoxGeometry(1.9, 0.1, 0.08);
    rail1.translate(0, 0.8, 0);
    this.applyColorToGeometry(rail1, new THREE.Color(0x92400e));
    geometries.push(rail1);

    // Rail Bottom
    const rail2 = rail1.clone();
    rail2.translate(0, -0.4, 0);
    geometries.push(rail2);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
    });
    return { geometry: merged, material: mat };
  }

  // --- FENCE CORNER ---
  private static createFenceCorner(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Center Post
    const post = new THREE.BoxGeometry(0.2, 1.1, 0.2);
    post.translate(0, 0.55, 0);
    this.applyColorToGeometry(post, new THREE.Color(0x78350f));
    geometries.push(post);

    // Rail 1 (X direction)
    const railX = new THREE.BoxGeometry(1.0, 0.1, 0.08);
    railX.translate(0.5, 0.75, 0);
    this.applyColorToGeometry(railX, new THREE.Color(0x92400e));
    geometries.push(railX);

    // Rail 2 (Z direction)
    const railZ = new THREE.BoxGeometry(0.08, 0.1, 1.0);
    railZ.translate(0, 0.75, 0.5);
    this.applyColorToGeometry(railZ, new THREE.Color(0x92400e));
    geometries.push(railZ);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
    });
    return { geometry: merged, material: mat };
  }

  // --- STREETLAMP ---
  private static createStreetlamp(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Iron Pole
    const pole = new THREE.CylinderGeometry(0.08, 0.12, 2.8, 8);
    pole.translate(0, 1.4, 0);
    this.applyColorToGeometry(pole, new THREE.Color(0x1e293b)); // Dark iron
    geometries.push(pole);

    // Lantern Box
    const lantern = new THREE.BoxGeometry(0.35, 0.45, 0.35);
    lantern.translate(0, 2.7, 0);
    this.applyColorToGeometry(lantern, new THREE.Color(0xf59e0b)); // Glowing warm lantern
    geometries.push(lantern);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.4,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
    });
    return { geometry: merged, material: mat };
  }

  // --- BENCH ---
  private static createBench(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Seat Plank
    const seat = new THREE.BoxGeometry(1.4, 0.08, 0.45);
    seat.translate(0, 0.45, 0);
    this.applyColorToGeometry(seat, new THREE.Color(0x78350f));
    geometries.push(seat);

    // Backrest
    const back = new THREE.BoxGeometry(1.4, 0.4, 0.08);
    back.translate(0, 0.85, -0.2);
    this.applyColorToGeometry(back, new THREE.Color(0x92400e));
    geometries.push(back);

    // Iron Legs
    const leg1 = new THREE.BoxGeometry(0.08, 0.45, 0.45);
    leg1.translate(-0.6, 0.225, 0);
    this.applyColorToGeometry(leg1, new THREE.Color(0x334155));
    geometries.push(leg1);

    const leg2 = leg1.clone();
    leg2.translate(1.2, 0, 0);
    geometries.push(leg2);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geometry: merged, material: mat };
  }

  // --- TABLE ---
  private static createTable(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Top
    const top = new THREE.BoxGeometry(1.4, 0.1, 0.9);
    top.translate(0, 0.75, 0);
    this.applyColorToGeometry(top, new THREE.Color(0x78350f));
    geometries.push(top);

    // Legs
    [-0.55, 0.55].forEach((x) => {
      [-0.3, 0.3].forEach((z) => {
        const leg = new THREE.BoxGeometry(0.1, 0.7, 0.1);
        leg.translate(x, 0.35, z);
        this.applyColorToGeometry(leg, new THREE.Color(0x523318));
        geometries.push(leg);
      });
    });

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geometry: merged, material: mat };
  }

  // --- BARREL STACK ---
  private static createBarrelStack(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    const makeBarrel = (x: number, y: number, z: number) => {
      const b = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8);
      b.translate(x, y + 0.4, z);
      this.applyColorToGeometry(b, new THREE.Color(0x92400e));
      return b;
    };

    geometries.push(makeBarrel(-0.3, 0, -0.2));
    geometries.push(makeBarrel(0.3, 0, -0.1));
    geometries.push(makeBarrel(0.0, 0.75, -0.15)); // Top barrel

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
    return { geometry: merged, material: mat };
  }

  // --- CRATE STACK ---
  private static createCrateStack(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    const makeCrate = (x: number, y: number, z: number, s: number = 0.7) => {
      const c = new THREE.BoxGeometry(s, s, s);
      c.translate(x, y + s / 2, z);
      this.applyColorToGeometry(c, new THREE.Color(0xb45309));
      return c;
    };

    geometries.push(makeCrate(-0.35, 0, 0, 0.75));
    geometries.push(makeCrate(0.35, 0, -0.1, 0.7));
    geometries.push(makeCrate(0.0, 0.7, -0.05, 0.6));

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    return { geometry: merged, material: mat };
  }

  // --- NOTICEBOARD ---
  private static createNoticeboard(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Posts
    const p1 = new THREE.BoxGeometry(0.12, 2.2, 0.12);
    p1.translate(-0.8, 1.1, 0);
    this.applyColorToGeometry(p1, new THREE.Color(0x523318));
    geometries.push(p1);

    const p2 = p1.clone();
    p2.translate(1.6, 0, 0);
    geometries.push(p2);

    // Board
    const board = new THREE.BoxGeometry(1.7, 1.0, 0.1);
    board.translate(0, 1.5, 0);
    this.applyColorToGeometry(board, new THREE.Color(0x78350f));
    geometries.push(board);

    // Paper notice sheet
    const paper = new THREE.BoxGeometry(0.4, 0.5, 0.02);
    paper.translate(-0.3, 1.5, 0.06);
    this.applyColorToGeometry(paper, new THREE.Color(0xfef08a));
    geometries.push(paper);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geometry: merged, material: mat };
  }

  // --- BONFIRE ---
  private static createBonfire(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Stone Ring
    const ring = new THREE.TorusGeometry(0.7, 0.15, 6, 12);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 0.15, 0);
    this.applyColorToGeometry(ring, new THREE.Color(0x475569));
    geometries.push(ring);

    // Logs
    for (let i = 0; i < 4; i++) {
      const log = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
      log.rotateZ(Math.PI / 4);
      log.rotateY((i * Math.PI) / 2);
      log.translate(0, 0.25, 0);
      this.applyColorToGeometry(log, new THREE.Color(0x451a03));
      geometries.push(log);
    }

    // Flame Cone
    const flame = new THREE.ConeGeometry(0.45, 0.8, 6);
    flame.translate(0, 0.65, 0);
    this.applyColorToGeometry(flame, new THREE.Color(0xf97316)); // Fiery orange
    geometries.push(flame);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      emissive: 0xea580c,
      emissiveIntensity: 0.85,
    });
    return { geometry: merged, material: mat };
  }

  // --- CART / WAGON ---
  private static createCart(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Body Box
    const body = new THREE.BoxGeometry(1.6, 0.5, 1.0);
    body.translate(0, 0.6, 0);
    this.applyColorToGeometry(body, new THREE.Color(0x78350f));
    geometries.push(body);

    // Wheels
    [-0.8, 0.8].forEach((x) => {
      const wheel = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12);
      wheel.rotateX(Math.PI / 2);
      wheel.translate(x, 0.4, 0);
      this.applyColorToGeometry(wheel, new THREE.Color(0x451a03));
      geometries.push(wheel);
    });

    // Shafts
    const shaft1 = new THREE.BoxGeometry(0.08, 0.08, 1.4);
    shaft1.translate(-0.4, 0.4, 1.0);
    this.applyColorToGeometry(shaft1, new THREE.Color(0x523318));
    geometries.push(shaft1);

    const shaft2 = shaft1.clone();
    shaft2.translate(0.8, 0, 0);
    geometries.push(shaft2);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geometry: merged, material: mat };
  }

  // --- CITY WALL STRAIGHT ---
  private static createWallStraight(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Main Stone Wall Body (4.0m length, 3.8m height, 1.2m thickness)
    const wall = new THREE.BoxGeometry(4.0, 3.8, 1.2);
    wall.translate(0, 1.9, 0);
    this.applyColorToGeometry(wall, new THREE.Color(0x475569)); // Dark slate stone
    geometries.push(wall);

    // Wooden Catwalk Planks on Top Rear
    const catwalk = new THREE.BoxGeometry(4.0, 0.18, 0.9);
    catwalk.translate(0, 3.8, -0.3);
    this.applyColorToGeometry(catwalk, new THREE.Color(0x523318));
    geometries.push(catwalk);

    // Stone Crenellations (3 Merlons)
    [-1.3, 0, 1.3].forEach((x) => {
      const merlon = new THREE.BoxGeometry(0.8, 0.8, 0.35);
      merlon.translate(x, 4.3, 0.425);
      this.applyColorToGeometry(merlon, new THREE.Color(0x334155));
      geometries.push(merlon);
    });

    // Support Wooden Struts
    [-1.5, 1.5].forEach((x) => {
      const strut = new THREE.BoxGeometry(0.15, 0.8, 0.7);
      strut.rotateX(-Math.PI / 6);
      strut.translate(x, 3.2, -0.6);
      this.applyColorToGeometry(strut, new THREE.Color(0x78350f));
      geometries.push(strut);
    });

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    return { geometry: merged, material: mat };
  }

  // --- CITY WALL BASTION TOWER ---
  private static createWallTower(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Stone Bastion Base
    const tower = new THREE.CylinderGeometry(1.8, 2.1, 5.2, 10);
    tower.translate(0, 2.6, 0);
    this.applyColorToGeometry(tower, new THREE.Color(0x334155));
    geometries.push(tower);

    // Overhanging Parapet
    const parapet = new THREE.CylinderGeometry(2.2, 1.9, 1.0, 10);
    parapet.translate(0, 5.7, 0);
    this.applyColorToGeometry(parapet, new THREE.Color(0x475569));
    geometries.push(parapet);

    // Conical Slate Roof
    const roof = new THREE.ConeGeometry(2.4, 2.4, 10);
    roof.translate(0, 7.4, 0);
    this.applyColorToGeometry(roof, new THREE.Color(0x0f172a)); // Dark slate black
    geometries.push(roof);

    // Iron Brazier / Torch Top
    const brazier = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    brazier.translate(0, 8.8, 0);
    this.applyColorToGeometry(brazier, new THREE.Color(0xf59e0b));
    geometries.push(brazier);

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geometry: merged, material: mat };
  }

  // --- CITY WALL GATEHOUSE ---
  private static createWallGate(): VillageAssetPackage {
    const geometries: THREE.BufferGeometry[] = [];

    // Left Flanking Tower
    const leftTower = new THREE.BoxGeometry(1.8, 5.0, 2.2);
    leftTower.translate(-2.4, 2.5, 0);
    this.applyColorToGeometry(leftTower, new THREE.Color(0x334155));
    geometries.push(leftTower);

    // Right Flanking Tower
    const rightTower = leftTower.clone();
    rightTower.translate(4.8, 0, 0);
    geometries.push(rightTower);

    // Connecting Arch / Bridge Span
    const bridge = new THREE.BoxGeometry(3.2, 1.6, 2.2);
    bridge.translate(0, 4.2, 0);
    this.applyColorToGeometry(bridge, new THREE.Color(0x475569));
    geometries.push(bridge);

    // Portcullis Grate / Wooden Arch Frame
    const frameLeft = new THREE.BoxGeometry(0.2, 3.4, 0.2);
    frameLeft.translate(-1.4, 1.7, 0);
    this.applyColorToGeometry(frameLeft, new THREE.Color(0x1e293b));
    geometries.push(frameLeft);

    const frameRight = frameLeft.clone();
    frameRight.translate(2.8, 0, 0);
    geometries.push(frameRight);

    // Conical Roofs for Gate Towers
    [-2.4, 2.4].forEach((x) => {
      const roof = new THREE.ConeGeometry(1.5, 1.8, 4);
      roof.rotateY(Math.PI / 4);
      roof.translate(x, 5.9, 0);
      this.applyColorToGeometry(roof, new THREE.Color(0x991b1b)); // Imperial crimson roof
      geometries.push(roof);
    });

    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geometry: merged, material: mat };
  }

  /**
   * Helper: Colors all vertices of a BufferGeometry with a solid THREE.Color
   */
  private static applyColorToGeometry(geo: THREE.BufferGeometry, color: THREE.Color): void {
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
}
