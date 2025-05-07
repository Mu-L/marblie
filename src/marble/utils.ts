import * as THREE from "three";

export function isMouseInTrackButton(cursor: THREE.Vector2) {
  const trackButtons: NodeListOf<Element> = document.querySelectorAll(".trackButton");
  if (trackButtons) {
    for (const element of trackButtons) {
      const rect = element.getBoundingClientRect();
      if (
        cursor.x > rect.left &&
        cursor.x < rect.right &&
        cursor.y > rect.top &&
        cursor.y < rect.bottom
      ) {
        return true;
      }
    }
  }

  return false;
}

export function getSignedAngle3D(
  a: THREE.Vector3,
  b: THREE.Vector3,
  normal = new THREE.Vector3(1, 0, 0)
) {
  const normalizedA = a.clone().normalize();
  const normalizedB = b.clone().normalize();
  const cross = new THREE.Vector3().crossVectors(normalizedA, normalizedB);
  const angle = normalizedA.angleTo(normalizedB);
  const sign = Math.sign(normal.dot(cross));
  const signedAngle = angle * sign;
  return normalizeAngle(signedAngle);
}

export function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}
