import * as THREE from 'three';
import { Entity } from './Entity';
import { BoxCollider, SphereCollider } from '../Systems/CollisionSystem';
import { AssetLoader } from '../Systems/AssetLoader';

/**
 * WorldObject represents a physical prop in the overworld.
 * Examples: trees, rocks, columns, signs, chests.
 * Handles procedural meshes and assigns correct physics bounds.
 */
export class WorldObject extends Entity {
  public objectType: string;
  protected assetLoader: AssetLoader;
  protected geometries: THREE.BufferGeometry[] = [];
  protected materials: THREE.Material[] = [];
  protected pointLight: THREE.PointLight | null = null;
  protected baseLightIntensity: number = 0;

  constructor(id: string, objectType: string, assetLoader: AssetLoader) {
    super(id);
    this.objectType = objectType;
    this.assetLoader = assetLoader;
  }

  /**
   * Builds the physical representation and defines matching collider properties.
   */
  public init(): void {
    const typeUpper = this.objectType.toUpperCase();

    if (typeUpper === 'TREE') {
      this.buildTree();
      // Physical base trunk collider
      this.collider = new SphereCollider(0.6, new THREE.Vector3(0, 0, 0));
    } else if (typeUpper === 'COLUMN') {
      this.buildColumn();
      // Physical column base block collider
      this.collider = new BoxCollider(new THREE.Vector3(1.4, 4.0, 1.4), new THREE.Vector3(0, 2.0, 0));
    } else if (typeUpper === 'ROCK') {
      this.buildRock();
      // Small boulder collider
      this.collider = new SphereCollider(0.8, new THREE.Vector3(0, 0, 0));
    } else if (typeUpper === 'SIGN') {
      this.buildSign();
      // Small readable post sign
      this.collider = new BoxCollider(new THREE.Vector3(0.6, 1.2, 0.4), new THREE.Vector3(0, 0.6, 0));
    } else if (typeUpper === 'CHEST') {
      this.buildChest();
      // Wooden chest box collider
      this.collider = new BoxCollider(new THREE.Vector3(1.0, 0.8, 0.8), new THREE.Vector3(0, 0.4, 0));
    } else if (typeUpper === 'WALL') {
      this.buildWall();
      this.collider = new BoxCollider(new THREE.Vector3(2.0, 3.0, 2.0), new THREE.Vector3(0, 1.5, 0));
    } else if (typeUpper === 'TORCH') {
      this.buildTorch();
      this.collider = new BoxCollider(new THREE.Vector3(0.5, 1.8, 0.5), new THREE.Vector3(0, 0.9, 0));
    } else if (typeUpper === 'FOUNTAIN') {
      this.buildFountain();
      this.collider = new SphereCollider(1.2, new THREE.Vector3(0, 0.5, 0));
    } else if (typeUpper === 'BUSH') {
      this.buildBush();
      this.collider = new SphereCollider(0.5, new THREE.Vector3(0, 0.3, 0));
    } else if (typeUpper === 'FLOWER') {
      this.buildFlower();
      // Flowers don't block movement
    } else if (typeUpper === 'LANTERN') {
      this.buildLantern();
      this.collider = new BoxCollider(new THREE.Vector3(0.4, 2.0, 0.4), new THREE.Vector3(0, 1.0, 0));
    } else if (typeUpper === 'BARREL') {
      this.buildBarrel();
      this.collider = new SphereCollider(0.45, new THREE.Vector3(0, 0.4, 0));
    } else if (typeUpper === 'STATUE') {
      this.buildStatue();
      this.collider = new BoxCollider(new THREE.Vector3(1.2, 2.5, 1.2), new THREE.Vector3(0, 1.25, 0));
    } else if (typeUpper === 'CRYSTAL') {
      this.buildCrystal();
      this.collider = new SphereCollider(0.6, new THREE.Vector3(0, 0.8, 0));
    } else if (typeUpper === 'ARCH') {
      this.buildArch();
      this.collider = new BoxCollider(new THREE.Vector3(2.5, 3.5, 0.8), new THREE.Vector3(0, 1.75, 0));
    } else if (typeUpper === 'BRAZIER') {
      this.buildBrazier();
      this.collider = new BoxCollider(new THREE.Vector3(0.8, 1.2, 0.8), new THREE.Vector3(0, 0.6, 0));
    } else if (typeUpper === 'FENCE') {
      this.buildFence();
      this.collider = new BoxCollider(new THREE.Vector3(2.0, 1.0, 0.3), new THREE.Vector3(0, 0.5, 0));
    } else if (typeUpper === 'MUSHROOM') {
      this.buildMushroom();
      // Small decorative foliage
    } else if (typeUpper === 'BRIDGE') {
      this.buildBridge();
      // Walkable platform
    } else if (typeUpper === 'RUIN') {
      this.buildRuin();
      this.collider = new BoxCollider(new THREE.Vector3(1.2, 0.8, 2.0), new THREE.Vector3(0, 0.4, 0));
    } else {
      // Default placeholder cube
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.container.add(mesh);
      this.geometries.push(geo);
      this.materials.push(mat);
      this.collider = new BoxCollider(new THREE.Vector3(1, 1, 1));
    }
  }

  public update(_deltaTime: number): void {
    // Dynamic organic flame & crystal light intensity flicker
    if (this.pointLight && this.baseLightIntensity > 0) {
      const noise = Math.sin(Date.now() * 0.008) * 0.15 + (Math.random() - 0.5) * 0.08;
      this.pointLight.intensity = Math.max(0.1, this.baseLightIntensity + noise);
    }
  }

  /**
   * Procedural or GLTF Tree creation
   */
  private buildTree(): void {
    const model = this.assetLoader.getModelInstance('pine_1') || 
                  this.assetLoader.getModelInstance('pine_2') || 
                  this.assetLoader.getModelInstance('oak_1') || 
                  this.assetLoader.getModelInstance('beach_palm_1');
    if (model) {
      model.scale.set(1.2, 1.2, 1.2);
      this.container.add(model);
      return;
    }

    const leavesMat = this.assetLoader.getMaterial('grass', { roughness: 0.9 });
    
    // Wood Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.y = 0.75;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.container.add(trunkMesh);
    this.geometries.push(trunkGeo);
    this.materials.push(trunkMat);

    // Pine Leaves Layers
    const layers = [
      { radius: 1.6, height: 1.8, y: 2.1 },
      { radius: 1.2, height: 1.4, y: 3.1 },
      { radius: 0.8, height: 1.0, y: 3.9 }
    ];

    layers.forEach((layer) => {
      const leafGeo = new THREE.ConeGeometry(layer.radius, layer.height, 5);
      const leafMesh = new THREE.Mesh(leafGeo, leavesMat);
      leafMesh.position.y = layer.y;
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.container.add(leafMesh);
      this.geometries.push(leafGeo);
    });
  }

  /**
   * Ancient pillar column
   */
  private buildColumn(): void {
    const model = this.assetLoader.getModelInstance('column') || 
                  this.assetLoader.getModelInstance('kcas_column') || 
                  this.assetLoader.getModelInstance('kcas_pillar') || 
                  this.assetLoader.getModelInstance('dungeon_column_small');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');

    // Base pedestal box
    const baseGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.container.add(baseMesh);
    this.geometries.push(baseGeo);

    // Shaft cylinder
    const shaftGeo = new THREE.CylinderGeometry(0.45, 0.5, 3.2, 8);
    const shaftMesh = new THREE.Mesh(shaftGeo, stoneMat);
    shaftMesh.position.y = 2.0;
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    this.container.add(shaftMesh);
    this.geometries.push(shaftGeo);

    // Top block
    const topGeo = new THREE.BoxGeometry(1.2, 0.4, 1.2);
    const topMesh = new THREE.Mesh(topGeo, stoneMat);
    topMesh.position.y = 3.8;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    this.container.add(topMesh);
    this.geometries.push(topGeo);
  }

  /**
   * Standard environmental boulder / rock
   */
  private buildRock(): void {
    const model = this.assetLoader.getModelInstance('rock_1') || 
                  this.assetLoader.getModelInstance('rock_2') || 
                  this.assetLoader.getModelInstance('desert_boulder_1');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
    
    const rockMesh = new THREE.Mesh(rockGeo, stoneMat);
    // Squash it a bit vertically for a natural look
    rockMesh.scale.set(1.1, 0.75, 1.1);
    rockMesh.position.y = 0.4;
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    this.container.add(rockMesh);
    this.geometries.push(rockGeo);
  }

  /**
   * Decorative readable wooden signpost / banner
   */
  private buildSign(): void {
    const model = this.assetLoader.getModelInstance('eastbrook_noticeboard') || 
                  this.assetLoader.getModelInstance('camp_signpost') || 
                  this.assetLoader.getModelInstance('dungeon_banner');
    if (model) {
      model.scale.set(0.8, 0.8, 0.8);
      this.container.add(model);
      return;
    }

    const postMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.9 });
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x8a5d3b, roughness: 0.8 });

    // Vertical post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
    const postMesh = new THREE.Mesh(postGeo, postMat);
    postMesh.position.y = 0.6;
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    this.container.add(postMesh);
    this.geometries.push(postGeo);
    this.materials.push(postMat);

    // Horizontal text board
    const boardGeo = new THREE.BoxGeometry(0.8, 0.4, 0.1);
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, 0.9, 0);
    boardMesh.castShadow = true;
    boardMesh.receiveShadow = true;
    this.container.add(boardMesh);
    this.geometries.push(boardGeo);
    this.materials.push(boardMat);
  }

  /**
   * JRPG Style chest
   */
  private buildChest(): void {
    const model = this.assetLoader.getModelInstance('dungeon_chest') || 
                  this.assetLoader.getModelInstance('beach_chest') || 
                  this.assetLoader.getModelInstance('banker_chest');
    if (model) {
      model.scale.set(1.2, 1.2, 1.2);
      this.container.add(model);
      return;
    }

    const chestMat = new THREE.MeshStandardMaterial({ color: 0x824419, roughness: 0.7 });
    const lockMat = new THREE.MeshStandardMaterial({ color: 0xdbb40c, roughness: 0.3, metalness: 0.8 });

    // Chest box
    const boxGeo = new THREE.BoxGeometry(0.9, 0.5, 0.7);
    const boxMesh = new THREE.Mesh(boxGeo, chestMat);
    boxMesh.position.y = 0.25;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    this.container.add(boxMesh);
    this.geometries.push(boxGeo);
    this.materials.push(chestMat);

    // Lid (curved half-cylinder top)
    const lidGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12, 1, false, 0, Math.PI);
    const lidMesh = new THREE.Mesh(lidGeo, chestMat);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.position.set(0, 0.5, 0);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    this.container.add(lidMesh);
    this.geometries.push(lidGeo);

    // Gold padlock buckle
    const lockGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
    const lockMesh = new THREE.Mesh(lockGeo, lockMat);
    lockMesh.position.set(0, 0.4, 0.36);
    lockMesh.castShadow = true;
    this.container.add(lockMesh);
    this.geometries.push(lockGeo);
    this.materials.push(lockMat);
  }

  /**
   * Stone brick wall block for dungeon labyrinths
   */
  private buildWall(): void {
    const model = this.assetLoader.getModelInstance('kcas_wall') || 
                  this.assetLoader.getModelInstance('eastbrook_wall_wing');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const wallMat = this.assetLoader.getMaterial('stone');
    const wallGeo = new THREE.BoxGeometry(2.0, 3.0, 2.0);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.y = 1.5;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    this.container.add(wallMesh);
    this.geometries.push(wallGeo);
  }

  /**
   * Dungeon torch stand with point light glow
   */
  private buildTorch(): void {
    const model = this.assetLoader.getModelInstance('kcas_torch') || 
                  this.assetLoader.getModelInstance('yumi_brazier_stand') || 
                  this.assetLoader.getModelInstance('camp_fire_pit');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      this.pointLight = new THREE.PointLight(0xffaa00, 2.2, 8);
      this.pointLight.position.y = 1.2;
      this.baseLightIntensity = 2.2;
      this.container.add(this.pointLight);
      return;
    }

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // Stand pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.6, 6);
    const poleMesh = new THREE.Mesh(poleGeo, woodMat);
    poleMesh.position.y = 0.8;
    poleMesh.castShadow = true;
    this.container.add(poleMesh);
    this.geometries.push(poleGeo);
    this.materials.push(woodMat);

    // Iron cup
    const cupGeo = new THREE.CylinderGeometry(0.2, 0.12, 0.25, 8);
    const cupMesh = new THREE.Mesh(cupGeo, ironMat);
    cupMesh.position.y = 1.65;
    this.container.add(cupMesh);
    this.geometries.push(cupGeo);
    this.materials.push(ironMat);

    // Flame sphere
    const flameGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.y = 1.85;
    this.container.add(flameMesh);
    this.geometries.push(flameGeo);
    this.materials.push(flameMat);

    // Point Light source
    const light = new THREE.PointLight(0xff7700, 2.0, 8);
    light.position.y = 1.9;
    this.container.add(light);
  }

  /**
   * Sanctuary fountain
   */
  private buildFountain(): void {
    const model = this.assetLoader.getModelInstance('well') || 
                  this.assetLoader.getModelInstance('hex_well');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0099ff, roughness: 0.1, transparent: true, opacity: 0.8 });

    // Basin
    const basinGeo = new THREE.CylinderGeometry(1.2, 1.0, 0.6, 12);
    const basinMesh = new THREE.Mesh(basinGeo, stoneMat);
    basinMesh.position.y = 0.3;
    basinMesh.castShadow = true;
    basinMesh.receiveShadow = true;
    this.container.add(basinMesh);
    this.geometries.push(basinGeo);

    // Water surface
    const waterGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.05, 12);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0.55;
    this.container.add(waterMesh);
    this.geometries.push(waterGeo);
    this.materials.push(waterMat);
  }

  /**
   * Overworld bush foliage
   */
  private buildBush(): void {
    const model = this.assetLoader.getModelInstance('bush') || 
                  this.assetLoader.getModelInstance('bush_flowers');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const bushMat = this.assetLoader.getMaterial('grass', { roughness: 0.95 });
    const bushGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const mesh = new THREE.Mesh(bushGeo, bushMat);
    mesh.scale.set(1.2, 0.8, 1.2);
    mesh.position.y = 0.35;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.container.add(mesh);
    this.geometries.push(bushGeo);

    // Decorative berries
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 });
    for (let i = 0; i < 4; i++) {
      const berryGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const berryMesh = new THREE.Mesh(berryGeo, berryMat);
      const angle = (i * Math.PI) / 2;
      berryMesh.position.set(Math.cos(angle) * 0.35, 0.35 + (i % 2) * 0.1, Math.sin(angle) * 0.35);
      this.container.add(berryMesh);
      this.geometries.push(berryGeo);
    }
    this.materials.push(berryMat);
  }

  /**
   * Wildflower patch
   */
  private buildFlower(): void {
    const model = this.assetLoader.getModelInstance('flower_bed_round') || 
                  this.assetLoader.getModelInstance('flower_glow') || 
                  this.assetLoader.getModelInstance('bush_flowers');
    if (model) {
      model.scale.set(0.8, 0.8, 0.8);
      this.container.add(model);
      return;
    }

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });

    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 0.25;
      const oz = ((i % 2) - 0.5) * 0.25;

      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.set(ox, 0.15, oz);
      this.container.add(stemMesh);
      this.geometries.push(stemGeo);

      const petalGeo = new THREE.DodecahedronGeometry(0.08, 0);
      const petalMesh = new THREE.Mesh(petalGeo, petalMat);
      petalMesh.position.set(ox, 0.32, oz);
      this.container.add(petalMesh);
      this.geometries.push(petalGeo);
    }
    this.materials.push(stemMat);
    this.materials.push(petalMat);
  }

  /**
   * Village lantern lamp post
   */
  private buildLantern(): void {
    const model = this.assetLoader.getModelInstance('lantern_wall') || 
                  this.assetLoader.getModelInstance('kcas_torch');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      this.pointLight = new THREE.PointLight(0xfebc11, 2.2, 10);
      this.pointLight.position.y = 1.8;
      this.baseLightIntensity = 2.2;
      this.container.add(this.pointLight);
      return;
    }

    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // Base & Post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.8, 6);
    const postMesh = new THREE.Mesh(postGeo, ironMat);
    postMesh.position.y = 0.9;
    postMesh.castShadow = true;
    this.container.add(postMesh);
    this.geometries.push(postGeo);
    this.materials.push(ironMat);

    // Lamp Box
    const lampGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    const lampMesh = new THREE.Mesh(lampGeo, glassMat);
    lampMesh.position.y = 1.9;
    this.container.add(lampMesh);
    this.geometries.push(lampGeo);
    this.materials.push(glassMat);

    // Warm Point Light
    this.pointLight = new THREE.PointLight(0xfebc11, 2.2, 10);
    this.pointLight.position.y = 1.9;
    this.baseLightIntensity = 2.2;
    this.container.add(this.pointLight);
  }

  /**
   * Wooden Barrel
   */
  private buildBarrel(): void {
    const model = this.assetLoader.getModelInstance('barrel') || 
                  this.assetLoader.getModelInstance('beach_barrel') || 
                  this.assetLoader.getModelInstance('crate_wooden');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });

    const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10);
    const barrelMesh = new THREE.Mesh(barrelGeo, woodMat);
    barrelMesh.position.y = 0.4;
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    this.container.add(barrelMesh);
    this.geometries.push(barrelGeo);
    this.materials.push(woodMat);

    // Iron rings
    [-0.2, 0.2].forEach((offsetY) => {
      const ringGeo = new THREE.TorusGeometry(0.36, 0.02, 6, 12);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = 0.4 + offsetY;
      this.container.add(ringMesh);
      this.geometries.push(ringGeo);
    });
    this.materials.push(ringMat);
  }

  /**
   * Ancient Sanctuary Guardian Statue
   */
  private buildStatue(): void {
    const model = this.assetLoader.getModelInstance('golden_horse_statue') || 
                  this.assetLoader.getModelInstance('dungeon_statue_horse');
    if (model) {
      model.scale.set(0.8, 0.8, 0.8);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');

    // Pedestal
    const pedGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
    const pedMesh = new THREE.Mesh(pedGeo, stoneMat);
    pedMesh.position.y = 0.3;
    pedMesh.castShadow = true;
    pedMesh.receiveShadow = true;
    this.container.add(pedMesh);
    this.geometries.push(pedGeo);

    // Body Pillar
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
    const bodyMesh = new THREE.Mesh(bodyGeo, stoneMat);
    bodyMesh.position.y = 1.35;
    bodyMesh.castShadow = true;
    this.container.add(bodyMesh);
    this.geometries.push(bodyGeo);

    // Head / Crown Sphere
    const headGeo = new THREE.OctahedronGeometry(0.35, 1);
    const headMesh = new THREE.Mesh(headGeo, stoneMat);
    headMesh.position.y = 2.3;
    headMesh.castShadow = true;
    this.container.add(headMesh);
    this.geometries.push(headGeo);
  }

  /**
   * Magical Prana Crystal
   */
  private buildCrystal(): void {
    const model = this.assetLoader.getModelInstance('crystal_amethyst') || 
                  this.assetLoader.getModelInstance('star_heart_crystal');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      this.pointLight = new THREE.PointLight(0x38bdf8, 2.0, 8);
      this.pointLight.position.y = 1.0;
      this.baseLightIntensity = 2.0;
      this.container.add(this.pointLight);
      return;
    }

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });

    const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.scale.set(0.6, 1.4, 0.6);
    crystalMesh.position.y = 0.8;
    crystalMesh.castShadow = true;
    this.container.add(crystalMesh);
    this.geometries.push(crystalGeo);
    this.materials.push(crystalMat);

    // Ambient glow light
    this.pointLight = new THREE.PointLight(0x38bdf8, 1.8, 7);
    this.pointLight.position.y = 0.8;
    this.baseLightIntensity = 1.8;
    this.container.add(this.pointLight);
  }

  /**
   * Ancient Stone Portal Arch
   */
  private buildArch(): void {
    const model = this.assetLoader.getModelInstance('garden_arch') || 
                  this.assetLoader.getModelInstance('city_arch') || 
                  this.assetLoader.getModelInstance('dungeon_arch_stone');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');

    // Left pillar
    const leftPillarGeo = new THREE.BoxGeometry(0.6, 3.2, 0.6);
    const leftMesh = new THREE.Mesh(leftPillarGeo, stoneMat);
    leftMesh.position.set(-1.1, 1.6, 0);
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    this.container.add(leftMesh);
    this.geometries.push(leftPillarGeo);

    // Right pillar
    const rightPillarGeo = new THREE.BoxGeometry(0.6, 3.2, 0.6);
    const rightMesh = new THREE.Mesh(rightPillarGeo, stoneMat);
    rightMesh.position.set(1.1, 1.6, 0);
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    this.container.add(rightMesh);
    this.geometries.push(rightPillarGeo);

    // Top arch header
    const archTopGeo = new THREE.BoxGeometry(2.8, 0.6, 0.7);
    const archTopMesh = new THREE.Mesh(archTopGeo, stoneMat);
    archTopMesh.position.set(0, 3.2, 0);
    archTopMesh.castShadow = true;
    archTopMesh.receiveShadow = true;
    this.container.add(archTopMesh);
    this.geometries.push(archTopGeo);
  }

  /**
   * Dungeon Iron Fire Brazier
   */
  private buildBrazier(): void {
    const model = this.assetLoader.getModelInstance('bonfire') || 
                  this.assetLoader.getModelInstance('yumi_brazier_stand') || 
                  this.assetLoader.getModelInstance('camp_fire_pit');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      this.pointLight = new THREE.PointLight(0xf97316, 2.5, 12);
      this.pointLight.position.y = 0.8;
      this.baseLightIntensity = 2.5;
      this.container.add(this.pointLight);
      return;
    }

    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    const standGeo = new THREE.CylinderGeometry(0.4, 0.2, 0.8, 6);
    const standMesh = new THREE.Mesh(standGeo, ironMat);
    standMesh.position.y = 0.4;
    standMesh.castShadow = true;
    this.container.add(standMesh);
    this.geometries.push(standGeo);
    this.materials.push(ironMat);

    const fireGeo = new THREE.DodecahedronGeometry(0.25, 1);
    const fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.position.y = 0.9;
    this.container.add(fireMesh);
    this.geometries.push(fireGeo);
    this.materials.push(fireMat);

    this.pointLight = new THREE.PointLight(0xf97316, 2.5, 12);
    this.pointLight.position.y = 1.0;
    this.baseLightIntensity = 2.5;
    this.container.add(this.pointLight);
  }

  /**
   * Wooden Boundary Fence
   */
  private buildFence(): void {
    const model = this.assetLoader.getModelInstance('fence') || 
                  this.assetLoader.getModelInstance('garden_iron_fence') || 
                  this.assetLoader.getModelInstance('city_fence_wood');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    // Posts
    [-0.9, 0.9].forEach((x) => {
      const postGeo = new THREE.BoxGeometry(0.12, 1.0, 0.12);
      const postMesh = new THREE.Mesh(postGeo, woodMat);
      postMesh.position.set(x, 0.5, 0);
      postMesh.castShadow = true;
      this.container.add(postMesh);
      this.geometries.push(postGeo);
    });

    // Cross rails
    [0.3, 0.7].forEach((y) => {
      const railGeo = new THREE.BoxGeometry(1.9, 0.1, 0.08);
      const railMesh = new THREE.Mesh(railGeo, woodMat);
      railMesh.position.set(0, y, 0);
      railMesh.castShadow = true;
      this.container.add(railMesh);
      this.geometries.push(railGeo);
    });
    this.materials.push(woodMat);
  }

  /**
   * Bioluminescent Fungal Cluster
   */
  private buildMushroom(): void {
    const model = this.assetLoader.getModelInstance('mushroom');
    if (model) {
      model.scale.set(0.8, 0.8, 0.8);
      this.container.add(model);
      return;
    }

    const stemMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 0.2;
      const oz = ((i % 2) - 0.5) * 0.2;

      const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6);
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.set(ox, 0.15, oz);
      this.container.add(stemMesh);
      this.geometries.push(stemGeo);

      const capGeo = new THREE.ConeGeometry(0.18, 0.2, 8);
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(ox, 0.35, oz);
      this.container.add(capMesh);
      this.geometries.push(capGeo);
    }
    this.materials.push(stemMat);
    this.materials.push(capMat);
  }

  /**
   * Wooden Footbridge
   */
  private buildBridge(): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    // Deck planks
    const deckGeo = new THREE.BoxGeometry(2.4, 0.12, 1.2);
    const deckMesh = new THREE.Mesh(deckGeo, woodMat);
    deckMesh.position.y = 0.06;
    deckMesh.receiveShadow = true;
    deckMesh.castShadow = true;
    this.container.add(deckMesh);
    this.geometries.push(deckGeo);

    // Side handrails
    [-0.55, 0.55].forEach((z) => {
      const railGeo = new THREE.BoxGeometry(2.4, 0.1, 0.08);
      const railMesh = new THREE.Mesh(railGeo, woodMat);
      railMesh.position.set(0, 0.6, z);
      railMesh.castShadow = true;
      this.container.add(railMesh);
      this.geometries.push(railGeo);
    });
    this.materials.push(woodMat);
  }

  /**
   * Fallen Ancient Stone Ruin
   */
  private buildRuin(): void {
    const model = this.assetLoader.getModelInstance('column_broken') || 
                  this.assetLoader.getModelInstance('cave_entrance');
    if (model) {
      model.scale.set(1.0, 1.0, 1.0);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');

    const columnGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    columnGeo.rotateZ(Math.PI / 2); // Fallen on side
    const columnMesh = new THREE.Mesh(columnGeo, stoneMat);
    columnMesh.position.set(0, 0.4, 0);
    columnMesh.castShadow = true;
    columnMesh.receiveShadow = true;
    this.container.add(columnMesh);
    this.geometries.push(columnGeo);
  }

  /**
   * Frees GPU textures, geometries and structures
   */
  public destroy(): void {
    this.geometries.forEach((geo) => geo.dispose());
    this.materials.forEach((mat) => mat.dispose());
    this.geometries = [];
    this.materials = [];
  }
}
