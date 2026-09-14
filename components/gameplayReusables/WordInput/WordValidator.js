import { TAGALOG_WORD_DATABASE } from './TagalogWordDatabase';

/**
 * WordValidator
 * -------------
 * Its only job is: does this word exist in the configured database?
 * It knows nothing about the conveyor, input, or scoring — WordInputSystem
 * calls this, gets a plain boolean back, and decides what to do with it.
 *
 * A different/larger database can be swapped in per level later:
 *   isValidWord('BAHAY', someOtherDatabase)
 */
export function isValidWord(word, database = TAGALOG_WORD_DATABASE) {
  if (!word) return false;
  return database.has(word.toUpperCase());
}