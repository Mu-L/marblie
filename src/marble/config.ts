import * as THREE from "three";

export const defaults = {
  width: 1.5,
  height: 0.7,
  depth: 10,
  windmillDepth: 4,
  trackWidth: 1.3,
  trackDepth: 0.2,
  sections: 50,
  curvePoints: [
    new THREE.Vector3(0, 0, 3.5),
    new THREE.Vector3(0, -3, 0),
    new THREE.Vector3(0, 0, -3.5),
  ],
  trackFriction: 0.5,
  marbleFriction: 0.1,
  marbleRadius: 0.7,
};
