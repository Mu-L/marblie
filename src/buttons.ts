import {
  addStraightTrack,
  addCurveTrack,
  addWindmillTrack,
  addFunnelTrack,
  placeMarble,
  addRandomTrack,
  toggleDay,
  toggleFollowMarble,
  toggleAutoMarble,
  addLightCube,
  addTubeTrack,
} from "./Marblie.ts";

const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

// Show/hide About panel
document.querySelector(".aboutCloseButton")?.addEventListener("click", () => {
  document.querySelector(".about")?.classList.add("aboutHide");
});

document.getElementById("aboutToggle")?.addEventListener("click", () => {
  document.querySelector(".about")?.classList.toggle("aboutHide");
});

// Toggle buttons
document.getElementById("dayButton")?.addEventListener("click", toggleDay);
document.getElementById("autoMarbleButton")?.addEventListener("click", toggleAutoMarble);
document
  .getElementById("followMarbleButton")
  ?.addEventListener("click", toggleFollowMarble);

// Track button handlers

let isMouseDownOnTrack = false;
let startTouchX = 0;
let startTouchY = 0;
let buttonRect: any;
let createdTrack = false;

document.querySelectorAll(".trackButton").forEach((button) => {
  if (isTouchDevice) {
    // touch start
    button.addEventListener("touchstart", (event) => {
      console.log("touchstart");
      isMouseDownOnTrack = true;
      startTouchX = event.touches[0].clientX;
      startTouchY = event.touches[0].clientY;
      buttonRect = button.getBoundingClientRect();
    });

    // touch move
    button.addEventListener("touchmove", (event) => {
      console.log("touchmove");
      if (event.touches[0].clientY < buttonRect.top && !createdTrack) {
        createdTrack = true;
        addEventHandler(button);
      }
    });
  } else {
    button.addEventListener("mousedown", () => {
      isMouseDownOnTrack = true;
    });
    button.addEventListener("mouseleave", () => {
      if (isMouseDownOnTrack && !createdTrack) {
        createdTrack = true;
        addEventHandler(button);
      }
    });
    button.addEventListener("click", () => addEventHandler(button));
  }
});

const addEventHandler = (button: Element) => {
  const action = button.dataset.action;
  switch (action) {
    case "straight":
      addStraightTrack();
      break;
    case "curve":
      addCurveTrack();
      break;
    case "windmill":
      addWindmillTrack();
      break;
    case "funnel":
      addFunnelTrack();
      break;
    case "tube":
      addTubeTrack();
      break;
    case "random":
      addRandomTrack();
      break;
  }
};

// Marble placement
document.querySelector(".marbleButton")?.addEventListener("click", placeMarble);

window.addEventListener("mouseup", () => {
  isMouseDownOnTrack = false;
  createdTrack = false;
});

window.addEventListener("touchend", () => {
  isMouseDownOnTrack = false;
  createdTrack = false;
});
