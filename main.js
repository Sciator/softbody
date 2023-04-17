const { VerletPhysics2D, VerletParticle2D, VerletSpring2D } = toxi.physics2d;
const { GravityBehavior } = toxi.physics2d.behaviors;
const { Vec2D, Rect } = toxi.geom;

const POINTS_DIST = 1;

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
let springs = [];

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

function setup() {
  createCanvas(1280, 720);

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
  const length = Math.floor(Math.abs((end - start) / step)) + 1;
  return Array.from(Array(length), (_, i) => start + i * step);
}

Snap.load("logo.svg",
  (data) => {
    const svgPaths = data.selectAll("path").items;
    paths = svgPaths.map(path => range(0, path.getTotalLength(), POINTS_DIST).map(length => path.getPointAtLength(length)))
  });

function getPointsMinMax (points) {
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

function mousePressed() {
  mouseDragParticle.lock();
  mouseDragParticle.x = mouseX;
  mouseDragParticle.y = mouseY;
  mouseDragParticle.unlock();

  const flatParticles = pathsParticles.flat();

  const nearestParticles = flatParticles.filter(p => Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2) < 40);

  nearestParticles.forEach(p => {
    if (Math.random() < .2) {
      const spring = new VerletSpring2D(mouseDragParticle, p, dist(mouseDragParticle.x, mouseDragParticle.y, p.x, p.y), 0.005);
      physics.addSpring(spring);
      dragSprings.push(spring)
    }
  });
}

function mouseReleased() {
  dragSprings.splice(0).forEach(s => physics.removeSpring(s));
}

let initialized = false;

function initialize () {

    // scale points to width of canvas

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
        for (let j = i + 1; j < pathParticles.length; j++) {
          if (i !== j && Math.random() < .3) {
            let a = pathParticles[i];
            let b = pathParticles[j];
            const spring = new VerletSpring2D(a, b, dist(a.x, a.y, b.x, b.y), 0.001);
            physics.addSpring(spring);
            springs.push(spring)
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
              if (Math.random() < .005) {
                const spring = new VerletSpring2D(a, b, dist(a.x, a.y, b.x, b.y), 0.001);
                physics.addSpring(spring);
                springs.push(spring)
              }
            }
          }
      }
    }
}

function draw() {
  if (!initialized) {
    if (paths.length) {
      initialize();
      initialized = true;
    }
    return;
  }

  background(255);

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
    springs.forEach(s => renderSpring(s))
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
