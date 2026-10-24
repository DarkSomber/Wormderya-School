import { checkWord } from './WordApi';

/**
 * WordValidator
 * -------------
 * Does this word exist? Async, because the answer comes from the word API
 * (with a local cache). WordInputSystem awaits it and decides what to do.
 */
export async function isValidWord(word, check = checkWord) {
  if (!word) return false;
  return check(word);
}
