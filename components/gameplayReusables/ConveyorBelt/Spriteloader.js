/**
 * Minimal sprite registry so letters can eventually be drawn with real
 * artwork/animation frames instead of the text-in-a-box fallback.
 *
 * Once real letter sprites exist:
 *   import { registerLetterSprite } from './spriteLoader';
 *   registerLetterSprite('A', require('../../assets/Letters/A.png'));
 *
 * Letter.js already checks this registry first and only falls back to
 * plain text when nothing is registered for that character.
 */
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

/**
 * Placeholder for a future multi-frame sprite/animation system, e.g.
 *   registerLetterFrames('A', [frame1, frame2, frame3, frame1]);
 * Not used yet — kept here so the AnimationSystem/Letter have an obvious
 * place to plug into when frame-based animation is actually needed.
 */
const spriteFrameRegistry = {};

export function registerLetterFrames(character, frames) {
  spriteFrameRegistry[character.toUpperCase()] = frames;
}

export function getLetterFrames(character) {
  return spriteFrameRegistry[character?.toUpperCase()] || null;
}