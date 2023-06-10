// @ts-check
/// <reference path="./node_modules/@types/snapsvg/index.d.ts" />
/// <reference path="./node_modules/@types/p5/global.d.ts" />
import './libs/p5.min.js';

import { VerletParticle2D, VerletSpring2D, VerletEngine2D } from "./VerletPhysics.js";

import { createCustomSlider, drawSliderLabels, getSliderChangedValue, getSliderValue, resetSliderChanged } from "./sliders.js";

import * as rs from "./pkg/softbody.js";

rs.greet();

const counter = new rs.Counter();

console.log(counter.get_count());
counter.increment();
console.log(counter.get_count());
counter.increment();
console.log(counter.get_count());
counter.increment();
console.log(counter.get_count());
counter.increment();
console.log(counter.get_count());


const POINTS_DIST = .4;
const SPRING_PROBABILITY_LETTER = .03;
const SPRING_PROBABILITY_TEXT = .0002;
const SPRING_STRENGTH_LETTER = 0.003;
const SPRING_STRENGTH_TEXT = 0.001;
const SPRING_STRENGTH_LETTER_SHELL = .2;
const SHELL_STEPS = 1;

const DRAG_POINTS = 100;

const renderParticle = (particle, r = 10) => {
  push()
  stroke("#bbaa00");
  fill("#ffaa00");
  strokeWeight(1);
  circle(particle.position.x, particle.position.y, r);
  pop()
};

const renderSpring = (spring) => {
  strokeWeight(1);
  stroke("#0003");
  line(spring.particleA.position.x, spring.particleA.position.y, spring.particleB.position.x, spring.particleB.position.y);
};


/** @type {VerletParticle2D[][]} */
let pathsParticles = [];
let debugRender = false;
let mouseDragParticle;

let springsText = [];
let springsShell = [];
let springsLetter = [];

function keyPressed() {
  if (key == ' ') {
    debugRender = !debugRender;
  }
}

function updateWindowSize() {
  resizeCanvas(windowWidth, windowHeight);
  physics.constraint.x = windowWidth;
  physics.constraint.y = windowHeight;
};

const SLIDER_POINTS_DIST = "SLIDER_POINTS_DIST";
const SLIDER_SPRING_PROBABILITY_LETTER = "SLIDER_SPRING_PROBABILITY_LETTER";
const SLIDER_SPRING_PROBABILITY_TEXT = "SLIDER_SPRING_PROBABILITY_TEXT";
const SLIDER_SPRING_STRENGTH_LETTER = "SLIDER_SPRING_STRENGTH_LETTER";
const SLIDER_SPRING_STRENGTH_TEXT = "SLIDER_SPRING_STRENGTH_TEXT";
const SLIDER_SPRING_STRENGTH_LETTER_SHELL = "SLIDER_SPRING_STRENGTH_LETTER_SHELL";
const SLIDER_SHELL_STEPS = "SLIDER_SHELL_STEPS";

const SLIDERS_STRENGTH = [
  SLIDER_SPRING_STRENGTH_LETTER
  , SLIDER_SPRING_STRENGTH_TEXT
  , SLIDER_SPRING_STRENGTH_LETTER_SHELL
]

const SLIDERS_NUMBER = [
  SLIDER_SPRING_PROBABILITY_LETTER
  , SLIDER_SPRING_PROBABILITY_TEXT
  , SLIDER_SHELL_STEPS
]

const SLIDERS_ID = [SLIDER_POINTS_DIST].concat(SLIDERS_NUMBER).concat(SLIDERS_STRENGTH);

let physics = new VerletEngine2D();

window.setup = function setup() {
  createCanvas(1280, 720);

  createCustomSlider(SLIDER_SPRING_STRENGTH_LETTER, 0.0001, 0.02, SPRING_STRENGTH_LETTER, 0.0001, "SLIDER_SPRING_STRENGTH_LETTER")
  createCustomSlider(SLIDER_SPRING_STRENGTH_TEXT, 0.0001, 0.02, SPRING_STRENGTH_TEXT, 0.0001, "SLIDER_SPRING_STRENGTH_TEXT")
  createCustomSlider(SLIDER_SPRING_STRENGTH_LETTER_SHELL, 0.0001, 0.02, SPRING_STRENGTH_LETTER_SHELL, 0.0001, "SLIDER_SPRING_STRENGTH_LETTER_SHELL")

  // createCustomSlider(SLIDER_POINTS_DIST, 0.02, 2, 1, 0.01)

  // createCustomSlider(SLIDER_SPRING_PROBABILITY_LETTER, 0.0001, 0.02, 0.0001, 0.0001, "SLIDER_SPRING_PROBABILITY_LETTER")
  // createCustomSlider(SLIDER_SPRING_PROBABILITY_TEXT, 0.0001, 0.02, 0.0001, 0.0001, "SLIDER_SPRING_PROBABILITY_TEXT")
  // createCustomSlider(SLIDER_SHELL_STEPS, 0.0001, 0.02, 0.0001, 0.0001, "SLIDER_SHELL_STEPS")

  mouseDragParticle = new VerletParticle2D(0,0);

  updateWindowSize();
}

function windowResized() {
  updateWindowSize();
}

/** @type {{x: number, y: number}[][]} */
let paths = [];

function range(start, end, step = 1) {
  const length = Math.floor(Math.abs((end - start) / step));
  return Array.from(Array(length), (_, i) => start + i * step);
}

Snap.load("logo.svg",
  (data) => {
    const svgPaths = data.selectAll("path").items;
    paths = svgPaths.map(path => range(0, path.getTotalLength(), POINTS_DIST).map(length => path.getPointAtLength(length)))
  });

function getPointsMinMax(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
  }

  return {
    minX, maxX, minY, maxY
  }
}


const dragSprings = [];


/**
 * random - max excluded
 */
function randomInt(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(min + (Math.random() * (max - min)));
}

window.mousePressed = function mousePressed() {
  // mouseDragParticle.lock();
  mouseDragParticle.position.x = mouseX;
  mouseDragParticle.position.y = mouseY;
  // mouseDragParticle.unlock();

  const flatParticles = pathsParticles.flat();

  const nearestParticles = flatParticles.filter(p => Math.sqrt((p.position.x - mouseX) ** 2 + (p.position.y - mouseY) ** 2) < 80);

  for (let i = DRAG_POINTS; i-- && nearestParticles.length;) {
    const p = nearestParticles.splice(randomInt(nearestParticles.length), 1)[0];
    // const spring = new VerletSpring2D(mouseDragParticle, p, dist(mouseDragParticle.x, mouseDragParticle.y, p.x, p.y), 0.005);
    const spring = new VerletSpring2D(mouseDragParticle, p, 0.005);

    physics.springs.push(spring);
    dragSprings.push(spring)
  }
}

window.mouseReleased = function mouseReleased() {
  dragSprings.splice(0).forEach(s => physics.springs.splice(physics.springs.findIndex(x => x === s), 1));
}

let invalid = true;


function applyStringStrengths() {
  springsText.forEach(s => s.stiffness = getSliderValue(SLIDER_SPRING_STRENGTH_TEXT)*30);
  springsShell.forEach(s => s.stiffness = getSliderValue(SLIDER_SPRING_STRENGTH_LETTER_SHELL)*30);
  springsLetter.forEach(s => s.stiffness = getSliderValue(SLIDER_SPRING_STRENGTH_LETTER)*30);
}

function initialize() {
  const flatPoints = paths.flat();

  const { minX, maxX, minY, maxY } = getPointsMinMax(flatPoints);

  const currentWidth = (maxX - minX);
  const targetScale = width / currentWidth;

  flatPoints.forEach(p => {
    p.x -= minX;
    p.y -= minY;

    p.x *= targetScale;
    p.y *= targetScale;
  })

  paths.forEach(path => {
    const pathParticles = [];
    path.forEach(p => {
      const particle = new VerletParticle2D(p.x, p.y);
      physics.particles.push(particle);
      pathParticles.push(particle);
    })
    pathsParticles.push(pathParticles);
  })

  pathsParticles.flat().forEach(p => p.r = 0)

  for (const pathParticles of pathsParticles) {
    for (let i = 0; i < pathParticles.length; i++) {
      range(1, SHELL_STEPS + 1).forEach(() => {
        let a = pathParticles[i];
        let b = pathParticles[(i + SHELL_STEPS) % pathParticles.length];
        const spring = new VerletSpring2D(a, b, SPRING_STRENGTH_LETTER_SHELL);
        physics.springs.push(spring);
        springsShell.push(spring)
      });

      for (let j = i + 1 + SHELL_STEPS; j < pathParticles.length; j++) {
        if (Math.random() < SPRING_PROBABILITY_LETTER) {
          let a = pathParticles[i];
          let b = pathParticles[j];
          const spring = new VerletSpring2D(a, b, SPRING_STRENGTH_LETTER);
          physics.springs.push(spring);
          springsLetter.push(spring)
        }
      }
    }
  }

  for (let k = 0; k < pathsParticles.length; k++) {
    for (let l = 0; l < pathsParticles.length; l++) {
      if (k !== l)
        for (let i = 0; i < pathsParticles[k].length; i++) {
          const a = pathsParticles[k][i];
          for (let j = i + 1; j < pathsParticles[l].length; j++) {
            const b = pathsParticles[l][j];
            if (Math.random() < SPRING_PROBABILITY_TEXT) {
              const spring = new VerletSpring2D(a, b, SPRING_STRENGTH_TEXT);
              physics.springs.push(spring);
              springsText.push(spring)
            }
          }
        }
    }
  }
}

let lastFrameTime = Date.now();

let maxDelta = 0;

window.draw = function draw() {
  if (invalid) {
    if (paths.length) {
      initialize();
      invalid = false;
    }
    return;
  }

  if (
    SLIDERS_STRENGTH.some(x => getSliderChangedValue(x))
  ) {
    applyStringStrengths()
    SLIDERS_STRENGTH.forEach(x => resetSliderChanged(x))
  }

  background(255);

  const now = Date.now()
  const delta = now - lastFrameTime;
  lastFrameTime = now;

  physics.update(delta);

  push()
  fill(0, 102, 153);
  stroke(0, 102, 153)
  strokeWeight(0)
  drawSliderLabels();
  pop()

  stroke(226, 38, 48, debugRender ? 120 : 255);
  fill(226, 38, 48, debugRender ? 120 : 255);

  strokeWeight(2);

  for (let pathParticles of pathsParticles) {
    beginShape();
    for (let particle of pathParticles) {
      vertex(particle.position.x, particle.position.y);
    }
    endShape(CLOSE);
  }

  if (debugRender) {
    springsLetter.forEach(s => renderSpring(s))
    springsText.forEach(s => renderSpring(s))
    springsShell.forEach(s => renderSpring(s))
    dragSprings.forEach(s => renderSpring(s));

    pathsParticles.flat().forEach(p => renderParticle(p))

    renderParticle(mouseDragParticle);
  }

  if (mouseIsPressed) {
    // mouseDragParticle.lock();
    mouseDragParticle.position.x = mouseX;
    mouseDragParticle.position.y = mouseY;
    // mouseDragParticle.unlock();
  }
}
