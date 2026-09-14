/**
 * Test word list of formal Tagalog/Filipino vocabulary — no slang, no
 * texting shorthand, no informal spellings. This is intentionally small
 * for the prototype; swap or extend it freely, WordValidator only needs
 * something that exposes `has(word)`.
 *
 * Every word here only uses letters currently in the test conveyor pool
 * (A,B,K,D,E,G,H,I,L,M,N,O,P,R,S,T,U,W,Y) so they're actually buildable
 * on the belt as it's configured today.
 */
export const TAGALOG_WORD_LIST = [
  'AKO',     // I
  'IKAW',    // you
  'TAYO',    // we (inclusive)
  'KAMI',    // we (exclusive)
  'BAHAY',   // house
  'TUBIG',   // water
  'ARAW',    // sun / day
  'GABI',    // night
  'BATA',    // child
  'TAO',     // person
  'MATA',    // eye
  'PUSO',    // heart
  'ISDA',    // fish
  'BATO',    // rock / stone
  'DAGAT',   // sea
  'BUNDOK',  // mountain
  'KAIN',    // eat
  'LAKAD',   // walk
  'BUHAY',   // life / alive
  'LUPA',    // earth / land
  'HANGIN',  // wind
  'APOY',    // fire
];

export const TAGALOG_WORD_DATABASE = new Set(
  TAGALOG_WORD_LIST.map((w) => w.toUpperCase())
);