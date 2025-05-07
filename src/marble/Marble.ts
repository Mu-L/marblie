import { PhysicsObject } from "./PhysicsObject";
import * as RAPIER from "@dimforge/rapier3d-compat";
import { defaults } from "./config";
import * as THREE from "three";
import { randFloat } from "three/src/math/MathUtils.js";

const marbleGeometry = new THREE.SphereGeometry(defaults.marbleRadius, 32, 32);

const setColors = {
  marble: (): THREE.Color =>
    new THREE.Color("#ff0e26").offsetHSL(randFloat(-0.01, 0.01), 0, 0),
};

const setMaterials = {
  marble: (): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      color: setColors.marble(),
      emissive: new THREE.Color("#ffc53d"),
      emissiveIntensity: 0.1,
    }),
};

export class Marble extends PhysicsObject {
  type: string;
  marblesArray: Marble[];
  light?: THREE.Light;

  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    radius: number = defaults.marbleRadius,
    light: THREE.Light,
    marblesArray: Marble[]
  ) {
    const group = new THREE.Group();
    const geometry = marbleGeometry;
    let material: THREE.MeshStandardMaterial;

    if (light) {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffbbc2"),
        emissive: new THREE.Color("#ead5ce"),
        emissiveIntensity: 1,
      });
      light.intensity = 1.5;

      group.add(light);
    } else {
      material = setMaterials.marble();
    }

    const mesh = new THREE.Mesh(geometry, material);

    group.add(mesh);

    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
    const colliderDesc = RAPIER.ColliderDesc.ball(radius)
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
      .setRestitution(0.1)
      .setFriction(defaults.marbleFriction);

    world.createCollider(colliderDesc, body);

    super(scene, group, world, body);

    this.type = "Marble";
    marblesArray.push(this);
    this.marblesArray = marblesArray;
    if (light) this.light = light;

    mesh.castShadow = false;
    mesh.receiveShadow = false;
  }

  dispose(): void {
    const index = this.marblesArray.indexOf(this);
    this.marblesArray.splice(index, 1);
    super.dispose();
    if (this.light) {
      this.light.userData.inUse = false;
    }
  }

  update(): void {
    if (this.group.position.y < -50) {
      this.dispose();
    } else {
      this.updateBodyToMesh();
    }
  }
}
