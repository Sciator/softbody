// @ts-check

const sliders = {};
const slidersLastValues = {};
export var drawSliderLabels = () =>{};

export function createCustomSlider(id, min, max, value, step, label) {
  const index = Object.entries(sliders).length;
  const slider = createSlider(min, max, value, step);
  const posY = 20+ 18 * index;
  slider.position(10, posY);
  slider.style('width', '80px');

  const olddrawSliderLabels = drawSliderLabels;
  drawSliderLabels = () =>{
    text(label, 100, posY+15);
    olddrawSliderLabels()
  };


  sliders[id] = slider;
}

export function getSliderValue(id) {
  const slider = sliders[id];
  const newValue = slider.value();
  
  return newValue;
}

export function getSliderValueOld(id) {
  const oldValue = slidersLastValues[id];
  return oldValue;
}

export function getSliderChangedValue(id) {
  const newValue = getSliderValue(id);
  const oldValue = getSliderValueOld(id);

  if (newValue === oldValue) return;
  return newValue;
}

export function resetSliderChanged(id) {
  slidersLastValues[id] = getSliderValue(id);
}