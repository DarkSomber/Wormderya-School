import React from 'react';
import SlideshowSequence from '../components/SlideshowSequence';
import CountdownSequence from '../components/CountdownSequence';
import { computeStars } from '../components/gameplayReusables/UseScoreSystem';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function goalSlide(levelConfig) {
  const customers = levelConfig.totalCustomers;
  if (!Number.isFinite(customers)) {
    return {
      id: 'goal',
      label: levelConfig.title,
      subLabel: 'Serve as many words as you can\nbefore time runs out',
      ms: 2800,
    };
  }
  const perCustomer = levelConfig.wordsPerCustomer;
  return {
    id: 'goal',
    label: `Serve ${plural(customers, 'customer')}`,
    subLabel:
      `${plural(perCustomer, 'word')} for each customer\n` +
      `${plural(customers * perCustomer, 'word')} in total\n` +
      `Target score: ${levelConfig.targetScore}\n\n` +
      levelConfig.title,
    ms: 3200,
  };
}

export function LevelIntroSequence({ levelConfig, onComplete }) {
  const slides = [
    goalSlide(levelConfig),
    { id: 'ready', label: 'Ready?' }, 
    { id: 'set', label: 'Set...' },
    { id: 'go', label: 'GO!', subLabel: levelConfig.title },
  ];

  return (
    <CountdownSequence
      slides={slides}
      onComplete={onComplete}
      msPerSlide={700} 
    />
  );
}

export function LevelEndSequence({ levelConfig, won, finalScore, onComplete, rushHourStage = null, newRecord = false, customersServed = null, wordsServed = null, onMenu }) {
  const stars = computeStars(finalScore, levelConfig.targetScore);
  const starText = won ? '⭐'.repeat(stars) || '☆' : '';
  const recordText = newRecord ? '\nNEW RECORD!' : '';

  const servedLines = [];
  if (customersServed !== null && Number.isFinite(levelConfig.totalCustomers)) {
    servedLines.push(`Customers served: ${customersServed} / ${levelConfig.totalCustomers}`);
  }
  if (wordsServed !== null) servedLines.push(`Words served: ${wordsServed}`);
  const servedText = servedLines.length ? `\n${servedLines.join('\n')}` : '';

  const slides = rushHourStage !== null
    ? [
        {
          id: 'result',
          label: "TIME'S UP!",
          subLabel: `${levelConfig.title}\nStage reached: ${rushHourStage}${servedText}\nScore: ${finalScore}${recordText}`,
        },
      ]
    : [
        {
          id: 'result',
          label: won ? 'LEVEL CLEARED!' : 'OUT OF TIME',
          subLabel: won
            ? `${levelConfig.title}${servedText}\nScore: ${finalScore}   ${starText}${recordText}`
            : `${levelConfig.title}${servedText}\nScore: ${finalScore} / ${levelConfig.targetScore}`,
        },
      ];

  return (
    <SlideshowSequence
      slides={slides}
      onComplete={onComplete}
      lastLabel={won ? 'Continue ->' : 'Try Again'}
      secondaryLabel="Return to Menu"
      onSecondary={onMenu}
    />
  );
}