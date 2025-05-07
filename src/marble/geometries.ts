// @ts-nocheck

import { ExtrudeGeometry, Shape, ShapeGeometry } from "three";
import { defaults } from "./config";

export function curveTrackGeometry(shape, curve) {
  const extrusion = new ExtrudeGeometry(shape, {
    steps: 50,
    bevelEnabled: false,
    extrudePath: curve,
  });

  extrusion.translate(defaults.width, 0, 0);

  return extrusion;
}

export function straightTrackGeometry({ width, height, depth, trackWidth, trackDepth }) {
  const profile = trackShape({ width, height, depth, trackWidth, trackDepth });

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0,
    bevelSize: 0,
    // bevelOffset: 0,
    // bevelSegments: 0,
  };

  const geometry = new ExtrudeGeometry(profile, extrudeSettings).translate(
    0,
    0,
    -depth / 2
  );

  return geometry;
}

export function trackShape({ width, height, depth, trackWidth, trackDepth }) {
  const wallWidth = (width - trackWidth) / 2;
  const profile = new Shape();

  profile.moveTo(0, 0);
  profile.lineTo(0, -height / 2);
  profile.lineTo(0 + wallWidth, -height / 2);
  profile.lineTo(0 + wallWidth, -height / 2 + trackDepth);
  profile.lineTo(0 + wallWidth + trackWidth, -height / 2 + trackDepth);
  profile.lineTo(0 + wallWidth + trackWidth, -height / 2);
  profile.lineTo(0 + wallWidth + trackWidth + wallWidth, -height / 2);
  profile.lineTo(0 + wallWidth + trackWidth + wallWidth, -height / 2 + height);
  profile.lineTo(0 + wallWidth + trackWidth, -height / 2 + height);
  profile.lineTo(0 + wallWidth + trackWidth, -height / 2 + height - trackDepth);
  profile.lineTo(0 + wallWidth, -height / 2 + height - trackDepth);
  profile.lineTo(0 + wallWidth, -height / 2 + height);
  profile.lineTo(0, -height / 2 + height);
  profile.lineTo(0, 0);

  return profile;
}

export function anchorShape(dimensions) {
  const { width = 1.2, height = 0.7 } = dimensions;

  const profile = new Shape();

  profile.moveTo(-width / 2, -height / 2);
  profile.lineTo(width / 2, -height / 2);
  profile.lineTo(width / 2, height / 2);
  profile.arc(-width / 2, 0, width / 2, 0, Math.PI);
  profile.lineTo(-width / 2, -height / 2);

  return profile;
}

export function halfPillGeometry(dimensions) {
  const { depth = 0.2, trackWidth } = dimensions;
  const profile = anchorShape(dimensions);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0,
    bevelSize: 0,
    // bevelOffset: 0,
    // bevelSegments: 5,
  };

  const geometry = new ExtrudeGeometry(profile, extrudeSettings)
    .rotateY(Math.PI / 2)
    .translate(-trackWidth / 2 - depth, 0, 0);

  return geometry;
}
