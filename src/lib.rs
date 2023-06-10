#![allow(unused_variables)]
extern crate cfg_if;
extern crate wasm_bindgen;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

cfg_if! {
  // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
  // allocator.
  if #[cfg(feature = "wee_alloc")] {
    extern crate wee_alloc;
    #[global_allocator]
    static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
  }
}

#[wasm_bindgen]
pub struct Counter {
    count: i32,
}

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Counter { count: 0 }
    }

    #[wasm_bindgen]
    pub fn increment(&mut self) {
        self.count += 1;
    }

    #[wasm_bindgen]
    pub fn get_count(&self) -> i32 {
        self.count
    }
}

static mut number: i32 = 10;

#[wasm_bindgen]
extern {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}

#[wasm_bindgen]
pub unsafe fn greet() {
  let formatted_string = format!("The number is: {}", number);
  let my_str: &str = &formatted_string;
  log(my_str);
}
