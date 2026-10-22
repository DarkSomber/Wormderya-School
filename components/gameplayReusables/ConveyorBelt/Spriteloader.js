
const spriteRegistry = {};

export function registerLetterSprite(character, source) {
  spriteRegistry[character.toUpperCase()] = source;
}

export function registerLetterSprites(map) {
  Object.entries(map).forEach(([character, source]) =>
    registerLetterSprite(character, source)
  );
}

export function getLetterSprite(character) {
  return spriteRegistry[character?.toUpperCase()] || null;
}

const spriteFrameRegistry = {};

export function registerLetterFrames(character, frames) {
  spriteFrameRegistry[character.toUpperCase()] = frames;
}

export function getLetterFrames(character) {
  return spriteFrameRegistry[character?.toUpperCase()] || null;
}