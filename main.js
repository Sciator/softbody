const { VerletPhysics2D, VerletParticle2D, VerletSpring2D } = toxi.physics2d;
const { GravityBehavior } = toxi.physics2d.behaviors;
const { Vec2D, Rect } = toxi.geom;

const POINTS_DIST = .4;
const SPRING_PROBABILITY_LETTER = .03;
const SPRING_PROBABILITY_TEXT = .0005;
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
  circle(particle.x, particle.y, r);
  pop()
};

const renderSpring = (spring) => {
  strokeWeight(1);
  stroke("#0003");
  line(spring.a.x, spring.a.y, spring.b.x, spring.b.y);
};


/** @type {VerletParticle2D[][]} */
let pathsParticles = [];
let debugRender = false;
let mouseDragParticle;
let physics;

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
  let bounds = new Rect(0, 0, width, height);
  physics.setWorldBounds(bounds);
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

function setup() {
  createCanvas(1280, 720);

  createCustomSlider(SLIDER_SPRING_STRENGTH_LETTER, 0.0001, 0.02, SPRING_STRENGTH_LETTER, 0.0001, "SLIDER_SPRING_STRENGTH_LETTER")
  createCustomSlider(SLIDER_SPRING_STRENGTH_TEXT, 0.0001, 0.02, SPRING_STRENGTH_TEXT, 0.0001, "SLIDER_SPRING_STRENGTH_TEXT")
  createCustomSlider(SLIDER_SPRING_STRENGTH_LETTER_SHELL, 0.0001, 0.02, SPRING_STRENGTH_LETTER_SHELL, 0.0001, "SLIDER_SPRING_STRENGTH_LETTER_SHELL")
  
  // createCustomSlider(SLIDER_POINTS_DIST, 0.02, 2, 1, 0.01)

  // createCustomSlider(SLIDER_SPRING_PROBABILITY_LETTER, 0.0001, 0.02, 0.0001, 0.0001, "SLIDER_SPRING_PROBABILITY_LETTER")
  // createCustomSlider(SLIDER_SPRING_PROBABILITY_TEXT, 0.0001, 0.02, 0.0001, 0.0001, "SLIDER_SPRING_PROBABILITY_TEXT")
  // createCustomSlider(SLIDER_SHELL_STEPS, 0.0001, 0.02, 0.0001, 0.0001, "SLIDER_SHELL_STEPS")

  physics = new VerletPhysics2D();

  const gravity = new GravityBehavior(new Vec2D(0, .1));
  physics.addBehavior(gravity);

  mouseDragParticle = new VerletParticle2D(0, 0);
  physics.addParticle(mouseDragParticle);

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

function mousePressed() {
  mouseDragParticle.lock();
  mouseDragParticle.x = mouseX;
  mouseDragParticle.y = mouseY;
  mouseDragParticle.unlock();

  const flatParticles = pathsParticles.flat();

  const nearestParticles = flatParticles.filter(p => Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2) < 80);

  for (let i = DRAG_POINTS; i-- && nearestParticles.length;) {
    const p = nearestParticles.splice(randomInt(nearestParticles.length), 1)[0];
    const spring = new VerletSpring2D(mouseDragParticle, p, dist(mouseDragParticle.x, mouseDragParticle.y, p.x, p.y), 0.005);
    physics.addSpring(spring);
    dragSprings.push(spring)
  }
}

function mouseReleased() {
  dragSprings.splice(0).forEach(s => physics.removeSpring(s));
}

let invalid = true;


function applyStringStrengths() {
  springsText.forEach(s => s.setStrength(getSliderValue(SLIDER_SPRING_STRENGTH_TEXT)));
  springsShell.forEach(s => s.setStrength(getSliderValue(SLIDER_SPRING_STRENGTH_LETTER_SHELL)));
  springsLetter.forEach(s => s.setStrength(getSliderValue(SLIDER_SPRING_STRENGTH_LETTER)));
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
      physics.addParticle(particle);
      pathParticles.push(particle);
    })
    pathsParticles.push(pathParticles);
  })


  for (pathParticles of pathsParticles) {
    for (let i = 0; i < pathParticles.length; i++) {
      range(1, SHELL_STEPS + 1).forEach(() => {
        let a = pathParticles[i];
        let b = pathParticles[(i + SHELL_STEPS) % pathParticles.length];
        const spring = new VerletSpring2D(a, b, dist(a.x, a.y, b.x, b.y), SPRING_STRENGTH_LETTER_SHELL);
        physics.addSpring(spring);
        springsShell.push(spring)
      });

      for (let j = i + 1 + SHELL_STEPS; j < pathParticles.length; j++) {
        if (Math.random() < SPRING_PROBABILITY_LETTER) {
          let a = pathParticles[i];
          let b = pathParticles[j];
          const spring = new VerletSpring2D(a, b, dist(a.x, a.y, b.x, b.y), SPRING_STRENGTH_LETTER);
          physics.addSpring(spring);
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
              const spring = new VerletSpring2D(a, b, dist(a.x, a.y, b.x, b.y), SPRING_STRENGTH_TEXT);
              physics.addSpring(spring);
              springsText.push(spring)
            }
          }
        }
    }
  }
}

function draw() {
  if (invalid) {
    if (paths.length) {
      initialize();
      invalid = false;
    }
    return;
  }

  if (
    SLIDERS_STRENGTH.some(x=>getSliderChangedValue(x))
  ) {
    applyStringStrengths();
    SLIDERS_STRENGTH.forEach(x=>resetSliderChanged(x))
  }

  background(255);

  push()
    fill(0, 102, 153);
  stroke(0,102,153)
  strokeWeight(0)
  drawSliderLabels();
  pop()

  physics.update();

  stroke(226, 38, 48, debugRender ? 120 : 255);
  fill(226, 38, 48, debugRender ? 120 : 255);

  strokeWeight(2);

  for (let pathParticles of pathsParticles) {
    beginShape();
    for (let particle of pathParticles) {
      vertex(particle.x, particle.y);
    }
    endShape(CLOSE);
  }

  if (debugRender) {
    springsLetter.forEach(s => renderSpring(s))
    springsText.forEach(s => renderSpring(s))
    // springsShell.forEach(s => renderSpring(s))
    dragSprings.forEach(s => renderSpring(s));

    renderParticle(mouseDragParticle);
  }

  if (mouseIsPressed) {
    mouseDragParticle.lock();
    mouseDragParticle.x = mouseX;
    mouseDragParticle.y = mouseY;
    mouseDragParticle.unlock();
  }
}
