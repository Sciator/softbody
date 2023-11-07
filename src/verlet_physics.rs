// WIP
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Vec2 {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl Vec2 {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Self {
        Vec2 { x, y }
    }

    #[wasm_bindgen]
    pub fn add(&self, other: &Vec2) -> Vec2 {
        Vec2::new(self.x + other.x, self.y + other.y)
    }

    #[wasm_bindgen]
    pub fn subtract(&self, other: &Vec2) -> Vec2 {
        Vec2::new(self.x - other.x, self.y - other.y)
    }

    #[wasm_bindgen]
    pub fn multiply(&self, scalar: f64) -> Vec2 {
        Vec2::new(self.x * scalar, self.y * scalar)
    }

    #[wasm_bindgen]
    pub fn divide(&self, scalar: f64) -> Vec2 {
        Vec2::new(self.x / scalar, self.y / scalar)
    }

    #[wasm_bindgen]
    pub fn magnitude(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    #[wasm_bindgen]
    pub fn normalize(&self) -> Vec2 {
        let magnitude = self.magnitude();
        Vec2::new(self.x / magnitude, self.y / magnitude)
    }
}


#[wasm_bindgen]
pub struct Particle {
    position: Vec2,
    position_last: Vec2,
    acceleration: Vec2,
    radius: f64,
    mass: f64,
}

#[wasm_bindgen]
impl Particle {
    #[wasm_bindgen(constructor)]
    pub fn new(position: Vec2, position_last: Vec2, acceleration: Vec2, radius: f64, mass: f64) -> Self {
        Particle {
            position,
            position_last,
            acceleration,
            radius,
            mass,
        }
    }
}

#[wasm_bindgen]
pub struct Spring {
    particle_a: Particle,
    particle_b: Particle,
    stiffness: f64,
    length: f64,
}

#[wasm_bindgen]
impl Spring {
    #[wasm_bindgen(constructor)]
    pub fn new(particle_a: Particle, particle_b: Particle, stiffness: f64, length: f64) -> Self {
        Spring {
            particle_a,
            particle_b,
            stiffness,
            length,
        }
    }
}

#[wasm_bindgen]
pub struct Engine {
    particles: Vec<Particle>,
    springs: Vec<Spring>,
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Engine {
            particles: Vec::new(),
            springs: Vec::new(),
        }
    }

    #[wasm_bindgen]
    pub fn add_particle(&mut self, particle: Particle) {
        self.particles.push(particle);
    }

    #[wasm_bindgen]
    pub fn add_spring(&mut self, spring: Spring) {
        self.springs.push(spring);
    }

    #[wasm_bindgen]
    pub fn instantiate_particle(&mut self, position: Vec2, position_last: Vec2, acceleration: Vec2, radius: f64, mass: f64) -> Particle {
        let particle = Particle::new(position, position_last, acceleration, radius, mass);
        self.particles.push(particle.clone());
        particle
    }

    #[wasm_bindgen]
    pub fn instantiate_spring(&mut self, particle_a: Particle, particle_b: Particle, stiffness: f64, length: f64) -> Spring {
        let spring = Spring::new(particle_a, particle_b, stiffness, length);
        self.springs.push(spring.clone());
        spring
    }
}