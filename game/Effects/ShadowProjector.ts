import * as THREE from 'three';

export class ShadowProjector {
  private mesh: THREE.Mesh;

  constructor() {
    const geo = new THREE.CircleGeometry(0.5, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.05; // Slightly above ground
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
}
