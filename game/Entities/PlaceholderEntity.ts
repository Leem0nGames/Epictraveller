import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { AssetLoader } from '../Systems/AssetLoader';

export type PlaceholderType = 'COLUMN' | 'TREE' | 'CRYSTAL';

/**
 * Concrete JRPG environmental props with custom behaviors and shadow configurations.
 * Showcases entity scalability and custom update loops (e.g. floating crystals).
 */
export class PlaceholderEntity extends BaseEntity {
  private type: PlaceholderType;
  private assetLoader: AssetLoader;
  private meshesToDispose: THREE.BufferGeometry[] = [];
  private materialsToDispose: THREE.Material[] = [];
  private animationTime: number = Math.random() * 100; // Offset animation starts

  constructor(id: string, type: PlaceholderType, assetLoader: AssetLoader) {
    super(id);
    this.type = type;
    this.assetLoader = assetLoader;
  }

  /**
   * Initialize geometry structures procedurally based on prop type
   */
  public init(): void {
    switch (this.type) {
      case 'COLUMN':
        this.buildRuinColumn();
        break;
      case 'TREE':
        this.buildStylizedTree();
        break;
      case 'CRYSTAL':
        this.buildFloatingCrystal();
        break;
    }
  }

  /**
   * Ruin Column: GLTF model or elegant stacked column
   */
  private buildRuinColumn(): void {
    const model = this.assetLoader.getModelInstance('column') || 
                  this.assetLoader.getModelInstance('kcas_column') || 
                  this.assetLoader.getModelInstance('dungeon_arch_stone') || 
                  this.assetLoader.getModelInstance('city_arch');
    if (model) {
      model.scale.set(0.8, 1.0, 0.8);
      this.container.add(model);
      return;
    }

    const stoneMat = this.assetLoader.getMaterial('stone');

    // Base pedestal
    const baseGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.container.add(baseMesh);
    this.meshesToDispose.push(baseGeo);

    // Main column shaft
    const shaftGeo = new THREE.CylinderGeometry(0.5, 0.6, 4.0, 8);
    const shaftMesh = new THREE.Mesh(shaftGeo, stoneMat);
    shaftMesh.position.y = 2.4;
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    this.container.add(shaftMesh);
    this.meshesToDispose.push(shaftGeo);

    // Capital / top header block
    const topGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
    const topMesh = new THREE.Mesh(topGeo, stoneMat);
    topMesh.position.y = 4.6;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    this.container.add(topMesh);
    this.meshesToDispose.push(topGeo);
  }

  /**
   * Stylized JRPG Tree: GLTF tree model or layered cones on trunk
   */
  private buildStylizedTree(): void {
    const model = this.assetLoader.getModelInstance('pine_1') || 
                  this.assetLoader.getModelInstance('oak_1') || 
                  this.assetLoader.getModelInstance('beach_palm_1');
    if (model) {
      model.scale.set(1.2, 1.2, 1.2);
      this.container.add(model);
      return;
    }

    const leavesMat = this.assetLoader.getMaterial('grass', { roughness: 0.9 });
    
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.y = 0.75;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.container.add(trunkMesh);
    this.meshesToDispose.push(trunkGeo);
    this.materialsToDispose.push(trunkMat);

    // Leaves layer 1 (bottom cone)
    const leafGeo1 = new THREE.ConeGeometry(1.8, 2.0, 5);
    const leafMesh1 = new THREE.Mesh(leafGeo1, leavesMat);
    leafMesh1.position.y = 2.2;
    leafMesh1.castShadow = true;
    leafMesh1.receiveShadow = true;
    this.container.add(leafMesh1);
    this.meshesToDispose.push(leafGeo1);

    // Leaves layer 2 (middle cone)
    const leafGeo2 = new THREE.ConeGeometry(1.4, 1.6, 5);
    const leafMesh2 = new THREE.Mesh(leafGeo2, leavesMat);
    leafMesh2.position.y = 3.2;
    leafMesh2.castShadow = true;
    leafMesh2.receiveShadow = true;
    this.container.add(leafMesh2);
    this.meshesToDispose.push(leafGeo2);

    // Leaves layer 3 (top cone)
    const leafGeo3 = new THREE.ConeGeometry(1.0, 1.2, 5);
    const leafMesh3 = new THREE.Mesh(leafGeo3, leavesMat);
    leafMesh3.position.y = 4.1;
    leafMesh3.castShadow = true;
    leafMesh3.receiveShadow = true;
    this.container.add(leafMesh3);
    this.meshesToDispose.push(leafGeo3);
  }

  /**
   * Hovering Mystical Crystal with glowing parameters
   */
  private buildFloatingCrystal(): void {
    // Elegant octagonal double pyramid
    const crystalGeo = new THREE.OctahedronGeometry(0.8, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff, // High-contrast electric turquoise JRPG savepoint crystal
      emissive: 0x004a55,
      roughness: 0.1,
      metalness: 0.9,
    });
    
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 1.5;
    crystalMesh.castShadow = true;
    crystalMesh.receiveShadow = true;
    this.container.add(crystalMesh);
    
    this.meshesToDispose.push(crystalGeo);
    this.materialsToDispose.push(crystalMat);

    // Add a glowing base ring
    const ringGeo = new THREE.TorusGeometry(1.0, 0.08, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00a3cc,
      emissive: 0x002233,
      roughness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.1;
    ringMesh.receiveShadow = true;
    this.container.add(ringMesh);

    this.meshesToDispose.push(ringGeo);
    this.materialsToDispose.push(ringMat);
  }

  /**
   * Run custom frame logic (e.g. rotating columns, floating/spinning crystal)
   */
  public update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.type === 'CRYSTAL') {
      const crystalMesh = this.container.children[0];
      const ringMesh = this.container.children[1];

      if (crystalMesh) {
        // Hover float animation up and down
        crystalMesh.position.y = 1.6 + Math.sin(this.animationTime * 2.5) * 0.25;
        // Spin around Y axis
        crystalMesh.rotation.y += deltaTime * 1.2;
        crystalMesh.rotation.z = Math.sin(this.animationTime * 1.5) * 0.1;
      }

      if (ringMesh) {
        // Slow counter-spin on the base ring
        ringMesh.rotation.z -= deltaTime * 0.4;
      }
    }
  }

  /**
   * Safely dispose graphics memory objects to prevent memory leaks
   */
  public destroy(): void {
    this.meshesToDispose.forEach((geo) => geo.dispose());
    this.materialsToDispose.forEach((mat) => mat.dispose());
    this.meshesToDispose = [];
    this.materialsToDispose = [];
  }
}
