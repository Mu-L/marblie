import gsap from "gsap";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";

export class PhysicsObject {
  id: string = Date.now().toString();

  group: THREE.Group;
  world: RAPIER.World;
  body: RAPIER.RigidBody;
  scene: THREE.Scene;
  type: string = "";
  timeline: GSAPTimeline = gsap.timeline();

  constructor(scene: THREE.Scene, group: THREE.Group, world: any, body: any) {
    this.group = group;
    this.world = world;
    this.body = body;
    this.scene = scene;
    this.group.userData.track = this;
    this.group.userData.isTrack = true;

    for (const mesh of group.children) {
      if ((mesh as THREE.Mesh).isMesh) {
        (mesh as THREE.Mesh).castShadow = true;
        (mesh as THREE.Mesh).receiveShadow = true;
      }
    }

    this.addToScene();

    return this;
  }

  addToScene() {
    this.scene.add(this.group);

    this.timeline.from(this.group.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.4,
      ease: "back.out(1.7)",
    });
  }

  delay(seconds: number = Math.random() * 0.5) {
    this.timeline.delay(seconds);
    return this;
  }

  dispose() {
    const remove = () => {
      this.scene.remove(this.group);
      this.world.removeRigidBody(this.body);

      for (const child of this.group.children) {
        child.material?.dispose();
      }
    };

    gsap.fromTo(
      this.group.scale,
      { x: 1, y: 1, z: 1 } as gsap.TweenVars,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.4,
        ease: "expo.out",
        onComplete: () => {
          remove();
        },
      } as gsap.TweenVars
    );
  }

  setRotation(x, y, z) {
    if (x instanceof THREE.Quaternion) {
      this.body.setRotation(x, true);
    } else {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
      this.body.setRotation(q, true);
    }
    this.updateBodyToMesh();

    return this;
  }

  addRotation(x, y, z) {
    const current = new THREE.Quaternion().copy(this.body.rotation());
    const added = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
    current.multiply(added);
    this.body.setRotation(current, true);
    this.updateBodyToMesh();
    return this;
  }

  setTranslation(x, y, z) {
    if (x instanceof THREE.Vector3) {
      this.body.setTranslation(x, true);
    } else {
      this.body.setTranslation(new THREE.Vector3(x, y, z), true);
    }
    this.updateBodyToMesh();
    return this;
  }

  addTranslation(x, y, z) {
    const current = new THREE.Vector3().copy(this.body.translation());
    current.add(new THREE.Vector3(x, y, z));
    this.body.setTranslation(current, true);
    return this;
  }

  updateBodyToMesh() {
    this.group.position.copy(this.body.translation());
    this.group.quaternion.copy(this.body.rotation());
    return this;
  }

  updateMeshToBody() {
    this.body.setTranslation(this.group.position, true);
    this.body.setRotation(this.group.quaternion, true);
    return this;
  }
}
