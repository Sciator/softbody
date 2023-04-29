/**
 * extended and based on:
 * https://github.com/johnBuffer/VerletSFML/blob/main/solver.hpp
 */

const FRICTION = 0.99;

(() => {
  class Vec2D {
    constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error("cannot create vecotr with NaN");
      }
    }

    static vec2D1 = new Vec2D(1, 1)

    add(otherVec) {
      return new Vec2D(this.x + otherVec.x, this.y + otherVec.y);
    }

    neg() {
      return new Vec2D(-this.x, -this.y)
    }

    sub(otherVec) {
      return this.add(otherVec.neg())
    }

    mul(scalar) {
      return new Vec2D(this.x * scalar, this.y * scalar)
    }

    div(scalar) {
      return new Vec2D(this.x / scalar, this.y / scalar)
    }

    len() {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    clampMax(vec) {
      return new Vec2D(Math.min(this.x, vec.x), Math.min(this.y, vec.y))
    }

    clampMin(vec) {
      return new Vec2D(Math.max(this.x, vec.x), Math.max(this.y, vec.y))
    }
  }

  class VerletEngine2D {
    constructor() {
      /** @type {VerletParticle2D[]} */
      this.particles = [];
      /** @type {VerletSpring2D[]} */
      this.springs = [];
      this.gravity = new Vec2D(0, 0.0001);
      this.constraint = new Vec2D(Infinity, Infinity);
      this.maxDeltaStep = 20;
    }

    update(dt) {

      const steps = Math.ceil(dt / this.maxDeltaStep);
      const stepDt = dt / steps;

      for (let i = 0; i < steps; i++) {
        this.applyForces()
        this.checkCollisions(stepDt)
        this.applyConstraint()
        this.updateObjects(stepDt)
      }
    }

    applyForces() {
      // gravity
      for (const p of this.particles) {
        p.addAcceleration(this.gravity)
      }
    }

    checkCollisions() {
      const responseCoeficient = 0.75;
      for (let i1 = 0; i1 < this.particles.length; i1++) {
        const p1 = this.particles[i1];
        if (!p1.r)
          continue;
        for (let i2 = i1 + 1; i2 < this.particles.length; i2++) {
          const p2 = this.particles[i2];
          const vecDif = p1.position.sub(p2.position)
          const dist = vecDif.len()
          const rTotal = p1.r + p2.r
          const mTotal = p1.m + p2.m
          if (dist < rTotal) {
            const mr1 = p1.m / mTotal
            const mr2 = p2.m / mTotal
            const delta = .5 * responseCoeficient * (dist - rTotal)
            p1.position = p1.position.sub(vecDif.mul(mr2 * delta))
            p2.position = p2.position.add(vecDif.mul(mr1 * delta))
          }
        }
      }
    }

    applyConstraint() {
      for (const p of this.particles) {
        const posMax = this.constraint.add(Vec2D.vec2D1.mul(-p.r));
        const posMin = new Vec2D(0, 0).add(Vec2D.vec2D1.mul(p.r));
        p.position = p.position.clampMax(posMax).clampMin(posMin);
      }
    }

    updateObjects(dt) {
      for (const p of this.particles) {
        p.update(dt)
      }
      for (const s of this.springs) {
        s.update()
      }
    }

  }

  class VerletParticle2D {
    constructor(x, y) {
      this.position = new Vec2D(x, y);
      this.positionLast = new Vec2D(x, y);
      this.acceleration = new Vec2D(0, 0);
      this.r = 1;
      this.m = 1;
    }

    update(dt) {
      if (!dt) throw new Error("no dt set for particle update")
      const moved = this.position.sub(this.positionLast);
      this.positionLast = this.position;
      this.position = this.position.add(moved).add(this.acceleration.mul(dt * dt));
      this.acceleration = new Vec2D();
    }

    addAcceleration(vec) {
      this.acceleration = this.acceleration.add(vec);
    }

    resetVelocity() {
      this.positionLast = this.position;
      debugger;
    }

    setVelocity(vec, dt) {
      this.resetVelocity();
      this.addVelocity(vec, dt);
      debugger;
    }

    addVelocity(vec, dt) {
      this.positionLast = vec.mul(dt);
      debugger;
    }

    getVelocity(dt) {
      return this.position.sub(this.positionLast).len() / dt;
    }
  }

  // used when disnace for Spring is 0
  const NEAREST_DISTANCE = 0.001;

  class VerletSpring2D {
    /**
     * 
     * @param {VerletParticle2D} particleA 
     * @param {VerletParticle2D} particleB 
     * @param {number} stiffness 
     * @param {number | unddefined} length 
     */
    constructor(particleA, particleB, stiffness = 1, length = undefined) {
      this.particleA = particleA;
      this.particleB = particleB;
      this.stiffness = stiffness;

      this.length = length ?? particleA.position.sub(particleB.position).len();
    }

    update() {
      const displacement = this.particleB.position.sub(this.particleA.position)
      const distance = displacement.len() || NEAREST_DISTANCE
      const difference = this.length - distance
      const percent = difference / distance / 2
      const force = displacement.mul(percent * this.stiffness)
      this.particleA.position = this.particleA.position.add(force.neg())
      this.particleB.position = this.particleB.position.add(force)
    }
  }

  window.VerletPhysics = {
    VerletParticle2D,
    VerletSpring2D,
    VerletEngine2D
  };
})()
