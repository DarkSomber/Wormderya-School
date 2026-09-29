import React from 'react';
import SlideshowSequence from '../components/SlideshowSequence';
import CountdownSequence from '../components/CountdownSequence';
import { computeStars } from '../components/gameplayReusables/UseScoreSystem';

//slideshow sequence turned props
export function LevelIntroSequence({ levelConfig, onComplete }) {
  const slides = [
    { id: 'ready', label: 'Ready?' }, 
    { id: 'set', label: 'Set...' },
    { id: 'go', label: 'GO!', subLabel: levelConfig.title },
  ];

  return (
    <CountdownSequence
      slides={slides}
      onComplete={onComplete}
      msPerSlide={700} // No need for manual pressing
    />
  );
}

//Generics for level end sequence screen
// `rushHourStage` (number) switches to the endless-run summary; null = a normal level.
export function LevelEndSequence({ levelConfig, won, finalScore, onComplete, rushHourStage = null }) { //Dynamic Props Generics
  const stars = computeStars(finalScore, levelConfig.targetScore); //Display results of ScoreHandler()
  const starText = won ? '⭐'.repeat(stars) || '☆' : '';

  const slides = rushHourStage !== null
    ? [
        {
          id: 'result',
          label: "TIME'S UP!",
          subLabel: `${levelConfig.title}\nStage reached: ${rushHourStage}\nScore: ${finalScore}`,
        },
      ]
    : [
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