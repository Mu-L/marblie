import * as THREE from "three";
// @ts-ignore
import { Track } from "./Track";
import { gsap } from "gsap";
import { getSignedAngle3D, isMouseInTrackButton } from "./utils";

const xAxis = new THREE.Vector3(1, 0, 0);
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

export class TrackTransformControls {
  isDragging: boolean = false;

  private handleOffset: number = isTouchDevice ? 1.5 : 1;

  private attachedTrack: Track;
  private attachedGroup: THREE.Object3D | null = null;
  private raycastPlane: THREE.Mesh;
  private handleR: Handle;
  private handleL: Handle;
  private handleM: Handle;
  private handles: Handle[];
  private activeHandle: Handle | null = null;
  selectedMesh: THREE.Mesh | null = null;

  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private cursor: THREE.Vector2 = new THREE.Vector2(-Infinity, -Infinity);

  raycastPlanePos: THREE.Vector3;
  private startObjectPosition: THREE.Vector3;
  private startHandleToObjectPos: THREE.Vector3 = new THREE.Vector3();
  private startObjectRotation: THREE.Euler = new THREE.Euler();
  private startObjectScale: THREE.Vector3 = new THREE.Vector3();
  private offset: THREE.Vector3;

  tracksArray: Track[];

  trashButton: Element | null = document.querySelector(".trashButton");
  trashRect = this.trashButton?.getBoundingClientRect();

  private eventTarget = new EventTarget();

  private trackType: string | null = null;

  // trackButtons: NodeListOf<Element> = document.querySelectorAll(".trackButton");

  constructor(
    private camera: THREE.Camera,
    private scene: THREE.Scene,
    tracksArray: Track[]
  ) {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-Infinity, -Infinity);
    this.raycastPlanePos = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    this.raycastPlane = this.createRaycastPlane();
    this.startObjectPosition = new THREE.Vector3();
    this.offset = new THREE.Vector3();

    this.handleL = new Handle();
    this.handleL.userData.id = "L";
    this.handleR = new Handle();
    this.handleR.userData.id = "R";
    this.handleM = new Handle();
    this.handleM.userData.id = "M";

    this.handles = [this.handleL, this.handleM, this.handleR];
    this.tracksArray = tracksArray;

    this.addEventListeners();
  }

  addEventListener(type: string, callback: (e: Event) => void) {
    this.eventTarget.addEventListener(type, callback);
  }

  removeEventListener(type: string, callback: (e: Event) => void) {
    this.eventTarget.removeEventListener(type, callback);
  }

  attach(group: THREE.Group) {
    this.detach();
    this.attachedGroup = group;
    this.attachedTrack = group.userData.track;
    this.trackType = this.attachedTrack.type;

    // Calculate offset between mesh position and raycast position
    if (this.attachedGroup) {
      this.startObjectPosition = this.attachedGroup.position.clone();
      this.offset.subVectors(this.raycastPlanePos, this.startObjectPosition);
    }

    this.positionHandles();
    this.showHandles();
  }

  detach() {
    this.attachedGroup = null;
    this.attachedTrack = null;
    this.trackType = null;
    this.removeHandles();
  }

  handleMouseMove = (event: MouseEvent) => {
    this.updatePointerPos(event);
    this.move();
  };

  handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updatePointerPos(touch);
      this.move();
    }
  };

  move = () => {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycastPlanePos.copy(this.raycaster.intersectObject(this.raycastPlane)[0].point);

    // handle mesh drag
    if (this.selectedMesh?.parent?.userData.isTrack) {
      this.positionGroup();
    }

    // handle handle drag
    if (this.activeHandle && this.attachedGroup) {
      // update handle position

      // Set max handle translation
      const objectToRaycast = new THREE.Vector3().subVectors(
        this.raycastPlanePos,
        this.attachedGroup.position
      );
      if (this.trackType === "StraightTrack") objectToRaycast.clampLength(2, 7);
      if (this.trackType === "CurveTrack") objectToRaycast.clampLength(0.5, 7);

      //
      this.activeHandle.position.addVectors(this.attachedGroup.position, objectToRaycast);

      if (this.trackType === "StraightTrack") {
        this.rotationScaleTransform();
      } else if (
        this.trackType === "RingTrack" ||
        this.trackType === "RingLongTrack" ||
        this.trackType === "TubeTrack" ||
        this.trackType === "LogoTrack"
      ) {
        this.rotationTransform();
      } else if (this.trackType === "CurveTrack") {
        this.curveTrackTransform();
      }
    }

    if (this.isDragging) {
      this.positionHandles();
    }
  };

  handleMouseDown = () => {
    this.select();
  };

  handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updatePointerPos(touch);
      this.select();
    }
  };

  select = () => {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    this.raycastPlanePos.copy(this.raycaster.intersectObject(this.raycastPlane)[0].point);

    // if intersect is Handle, activeHandle
    if (intersects[0]?.object.userData.type === "Handle") {
      this.isDragging = true;
      this.activeHandle = intersects[0].object as Handle;

      if (this.attachedGroup) {
        this.startObjectRotation = this.attachedGroup.rotation.clone();
        this.startObjectScale.copy(this.attachedGroup.scale);
        this.startHandleToObjectPos.subVectors(
          this.activeHandle.position,
          this.attachedGroup.position
        );
      }

      // if intersect is Track selectedMesh
      // mesh position editing
    } else if (intersects[0]?.object.parent?.userData.isTrack === true) {
      if (this.isDeletable(intersects[0]?.object.parent?.userData.type)) {
        // hide track bar and show delete dropbox
        setTimeout(() => {
          if (this.isDragging) this.hideTrackBar();
        }, 100);
      }

      this.isDragging = true;
      this.selectedMesh = intersects[0].object as THREE.Mesh;
    }
  };

  isDeletable(type: string) {
    if (
      type === "StraightTrack" ||
      type === "FunnelTrack" ||
      type === "CurveTrack" ||
      type === "RingTrack" ||
      type === "RingLongTrack" ||
      type === "ConeTrack" ||
      type === "WindmillTrack" ||
      type === "TubeTrack" ||
      type === "LightCube"
    ) {
      return true;
    } else {
      return false;
    }
  }

  hideTrackBar() {
    gsap.to(".overlayTrackBar", { translateY: "+130%", duration: 0.2 });
    gsap.to(".trashButton", { bottom: "1rem", duration: 0.2 });
  }

  showTrackBar() {
    gsap.to(".overlayTrackBar", { translateY: "", duration: 0.2 });
    gsap.to(".trashButton", { bottom: "-6rem", duration: 0.2 });
  }

  handleMouseUp = () => {
    return this.deselect();
  };

  handleTouchEnd = () => {
    this.deselect();
  };

  deselect = () => {
    if (this.attachedGroup) {
      this.showTrackBar();

      if (!isMouseInTrackButton(this.cursor)) {
        this.isDragging = false;
        this.selectedMesh = null;
      }
      this.activeHandle = null;

      // ----- Deleting Tracks -----
      if (this.isMouseInTrash()) {
        // Don't delete Starter, Tray track
        if (this.isDeletable(this.attachedTrack.type)) {
          // remove track from track array
          const index = this.tracksArray.indexOf(this.attachedTrack);
          if (index !== -1) this.tracksArray.splice(index, 1);

          this.attachedTrack.dispose();
          this.detach();
        }
      } else {
        // ----- Straight Track -----
        if (this.attachedTrack.type == "StraightTrack") {
          this.attachedTrack.updateMeshToBody();
          this.attachedTrack.removeColliders();
          this.attachedTrack.scale(
            this.attachedGroup.scale.x,
            this.attachedGroup.scale.y,
            this.attachedGroup.scale.z
          );

          // ----- Curve Track -----
        } else if (this.attachedTrack.type == "CurveTrack") {
          this.attachedTrack.updateMeshToBody();
          this.attachedTrack.removeCollider();
          this.attachedTrack.generateCollider();

          // ----- Windmill Track -----
        } else if (this.attachedTrack.type === "WindmillTrack") {
          this.attachedTrack.updateMeshToBody();
          this.attachedTrack.bladeBody.setTranslation(this.attachedGroup?.position);
        } else {
          this.attachedTrack.updateMeshToBody();
        }
      }

      this.eventTarget.dispatchEvent(new Event("edited"));
    }
  };

  isMouseInTrash() {
    this.trashRect = this.trashButton?.getBoundingClientRect();
    if (this.trashRect) {
      if (
        this.cursor.x > this.trashRect?.left &&
        this.cursor.x < this.trashRect.right &&
        this.cursor.y > this.trashRect.top &&
        this.cursor.y < this.trashRect.bottom
      ) {
        return true;
      }
    }

    return false;
  }

  logoTrackTransform() {
    this.handleRotation();
  }

  rotationTransform() {
    this.handleRotation();
  }

  handleRotation() {
    if (!this.attachedGroup || !this.activeHandle) return;

    const newHandlePosToObject = new THREE.Vector3().subVectors(
      this.activeHandle.position,
      this.attachedGroup.position
    );

    // --- Rotation ---
    const angle = getSignedAngle3D(this.startHandleToObjectPos, newHandlePosToObject);
    this.attachedGroup.rotation.x = this.startObjectRotation.x + angle;

    const handleID = this.activeHandle.userData.id;
    if (handleID === "R" || handleID === "L") {
      const targetHandle = handleID === "R" ? this.handleL : this.handleR;

      // Calculate mirrored start vector
      const mirroredPos = this.startHandleToObjectPos.clone().negate();
      const startLength = mirroredPos.length();

      // Adjust for offset and scaling
      mirroredPos.multiplyScalar((startLength - this.handleOffset) / startLength);
      mirroredPos.multiplyScalar(this.attachedGroup.scale.z);

      // Normalize length and rotate
      const newLength = mirroredPos.length();
      mirroredPos.multiplyScalar((1 + newLength) / newLength);
      mirroredPos.applyAxisAngle(xAxis, angle);

      // Apply final position
      targetHandle.position.copy(mirroredPos.add(this.attachedGroup.position));
    }
  }

  handleScale() {
    if (!this.attachedGroup || !this.activeHandle) return;

    const newHandlePosToObject = new THREE.Vector3().subVectors(
      this.activeHandle.position,
      this.attachedGroup.position
    );

    // --- Scale ---
    const startScalar = this.startHandleToObjectPos.length() - this.handleOffset;
    const newScalar = newHandlePosToObject.length() - this.handleOffset;
    const scalar = newScalar / startScalar;
    this.attachedGroup.scale.z = this.startObjectScale.z * scalar;
  }

  rotationScaleTransform() {
    this.handleRotation();
    this.handleScale();
  }

  curveTrackTransform() {
    if (!this.activeHandle || !this.attachedGroup) return;

    const endOffsetR = this.attachedTrack.curve
      .getTangent(0)
      .multiplyScalar(-this.handleOffset);
    const endOffsetL = this.attachedTrack.curve
      .getTangent(1)
      .multiplyScalar(this.handleOffset);

    const { curvePoints } = this.attachedTrack;
    const relativePos = this.activeHandle.position
      .clone()
      .sub(this.attachedGroup.position);

    switch (this.activeHandle.userData.id) {
      case "L":
        curvePoints[2]
          .copy(this.raycastPlanePos)
          .sub(this.attachedGroup.position)
          .sub(endOffsetL)
          .clampLength(0.5, 7);
        break;
      case "R":
        curvePoints[0]
          .copy(this.raycastPlanePos)
          .sub(this.attachedGroup.position)
          .sub(endOffsetR)
          .clampLength(0.5, 7);
        break;
      case "M":
        curvePoints[1].copy(relativePos);
        break;
    }

    this.attachedTrack.buildCurve();
    this.attachedTrack.buildGeometry();
  }

  showHandles() {
    if (
      this.trackType === "StraightTrack" ||
      this.trackType === "RingTrack" ||
      this.trackType === "RingLongTrack" ||
      this.trackType === "TubeTrack" ||
      this.trackType === "LogoTrack"
    ) {
      this.scene.add(this.handleL, this.handleR);
    } else if (this.trackType === "CurveTrack") {
      this.scene.add(this.handleL, this.handleR, this.handleM);
    }

    for (const handle of this.handles) {
      gsap.fromTo(
        handle.scale,
        { x: 0, y: 0, z: 0 },
        {
          x: isTouchDevice ? 2 : 1,
          y: isTouchDevice ? 2 : 1,
          z: isTouchDevice ? 2 : 1,
          duration: 0.4,
          ease: "back.out(1.7)",
        }
      );
    }
  }

  removeHandles() {
    this.scene.remove(this.handleL, this.handleR, this.handleM);
  }

  positionGroup() {
    if (this.isDragging && this.attachedGroup) {
      const groupPos = this.attachedGroup.position;
      groupPos.copy(this.raycastPlanePos.sub(this.offset));
      this.positionHandles();
    }
  }

  positionHandles() {
    if (
      this.trackType == "StraightTrack" ||
      this.trackType == "LogoTrack" ||
      this.trackType == "RingTrack" ||
      this.trackType == "TubeTrack" ||
      this.trackType == "RingLongTrack"
    ) {
      this.positionLRHandles();
    } else if (this.trackType == "CurveTrack") {
      this.positionLRMHandles();
    }
  }

  positionLRHandles() {
    if (!this.attachedGroup) return;

    const mesh = this.attachedGroup.children[0] as THREE.Mesh;
    const geometry = mesh.geometry;
    geometry.computeBoundingSphere();
    const boundingSphere = geometry.boundingSphere;

    if (!boundingSphere) return;

    boundingSphere.radius *= this.attachedGroup.scale.z;

    const handleOffsetVec = new THREE.Vector3(0, 0, this.handleOffset).applyEuler(
      this.attachedGroup.rotation
    );
    const handlePosR = new THREE.Vector3(0, 0, boundingSphere.radius)
      .applyEuler(this.attachedGroup.rotation)
      .add(this.attachedGroup.position)
      .add(handleOffsetVec);

    const handlePosL = new THREE.Vector3(0, 0, -boundingSphere.radius)
      .applyEuler(this.attachedGroup.rotation)
      .add(this.attachedGroup.position)
      .add(handleOffsetVec.negate());

    this.handleR.position.copy(handlePosR);
    this.handleL.position.copy(handlePosL);
  }

  positionLRMHandles() {
    if (!this.attachedGroup) return;

    const endOffsetR = this.attachedTrack.curve
      .getTangent(0)
      .multiplyScalar(-this.handleOffset);
    const endOffsetL = this.attachedTrack.curve
      .getTangent(1)
      .multiplyScalar(this.handleOffset);

    const handlePosR = this.attachedTrack.curvePoints[0]
      .clone()
      .add(this.attachedGroup.position)
      .add(endOffsetR);
    const handlePosL = this.attachedTrack.curvePoints[2]
      .clone()
      .add(this.attachedGroup.position)
      .add(endOffsetL);
    const handlePosM = this.attachedTrack.curvePoints[1]
      .clone()
      .add(this.attachedGroup.position);

    this.handleR.position.copy(handlePosR);
    this.handleL.position.copy(handlePosL);
    this.handleM.position.copy(handlePosM);
  }

  addEventListeners() {
    if (!isTouchDevice) {
      window.addEventListener("mousemove", this.handleMouseMove);
      window.addEventListener("mousedown", this.handleMouseDown);
      window.addEventListener("mouseup", this.handleMouseUp);
    } else {
      window.addEventListener("touchmove", this.handleTouchMove);
      window.addEventListener("touchstart", this.handleTouchStart);
      window.addEventListener("touchend", this.handleTouchEnd);
    }
  }

  updatePointerPos(event: MouseEvent | Touch) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.cursor.x = event.clientX;
    this.cursor.y = event.clientY;
  }

  createRaycastPlane(): THREE.Mesh {
    const raycastPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000, 2, 2).rotateY(Math.PI / 2),
      new THREE.MeshBasicMaterial({ visible: true, color: 0xff0000 })
    );
    raycastPlane.userData.type = "RaycastPlane";
    return raycastPlane;
  }
}

class Handle extends THREE.Mesh {
  constructor() {
    const geometry = new THREE.SphereGeometry(isTouchDevice ? 0.5 : 1);
    geometry.rotateZ(Math.PI / 2);
    geometry.translate(0.8, 0, 0);
    super(geometry, new THREE.MeshBasicMaterial({ color: 0xffff00 }));

    this.userData.type = "Handle";
  }
}
