import React from 'react';
import SlideshowSequence from '../components/SlideshowSequence';
import { computeStars } from '../useScoreSystem';

/**
 * IntroEndSequence
 * -----------------
 * "Take the existing SlideshowSequence and adapt it to take dynamic
 * props (level titles, star ratings, pass/fail) so it works across all
 * levels" — this file is exactly that adapter. It doesn't touch how
 * SlideshowSequence renders/advances slides at all; it only builds the
 * `slides` array SlideshowSequence expects, from whatever LevelConfig
 * and score are currently active. New levels need zero changes here.
 *
 * Star rating itself is computed by the Score Handler (computeStars,
 * from useScoreSystem.js) — this file just displays the result, it
 * doesn't own the scoring rule anymore.
 */

/**
 * LevelIntroSequence
 * "Ready, Set, Go!" — three tap-to-advance slides, last one showing the
 * level's title from LevelConfig.
 */
export function LevelIntroSequence({ levelConfig, onComplete }) {
  const slides = [
    { id: 'ready', label: 'Ready?' },
    { id: 'set', label: 'Set...' },
    { id: 'go', label: 'GO!', subLabel: levelConfig.title },
  ];

  return (
    <SlideshowSequence
      slides={slides}
      onComplete={onComplete}
      nextLabel="Next ->"
      lastLabel="Start!"
    />
  );
}

/**
 * LevelEndSequence
 * Single win/lose slide. Star rating (0-3) comes from the Score
 * Handler's computeStars(), so tuning stars for a level is just tuning
 * targetScore in that level's LevelConfig — nothing here needs to
 * change per-level.
 */
export function LevelEndSequence({ levelConfig, won, finalScore, onComplete }) {
  const stars = computeStars(finalScore, levelConfig.targetScore);
  const starText = won ? '⭐'.repeat(stars) || '☆' : '';

  const slides = [
    {
      id: 'result',
      label: won ? 'LEVEL CLEARED!' : 'OUT OF TIME',
      subLabel: won
        ? `${levelConfig.title}\nScore: ${finalScore}   ${starText}`
        : `${levelConfig.title}\nScore: ${finalScore} / ${levelConfig.targetScore}`,
    },
  ];

  return (
    <SlideshowSequence
      slides={slides}
      onComplete={onComplete}
      lastLabel={won ? 'Continue ->' : 'Try Again'}
    />
  );
}