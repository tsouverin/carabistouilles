export const PlayerClass = {
  Warrior: "warrior",
  Paladin: "paladin",
  Archer: "archer",
  Wizard: "wizard",
} as const;


export type PlayerClass =
  (typeof PlayerClass)[keyof typeof PlayerClass];


export const PlayerStatus = {
  Alive: "alive",
  Dead: "dead",
  Ghost: "ghost",
} as const;

export type PlayerStatus =
  (typeof PlayerStatus)[keyof typeof PlayerStatus];
