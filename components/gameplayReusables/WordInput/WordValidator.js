import { checkWord } from './WordApi';

export async function isValidWord(word, check = checkWord) {
  if (!word || word.length < 2) return false; 
  return check(word);
}