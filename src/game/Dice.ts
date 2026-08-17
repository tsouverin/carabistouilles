import { PlayerClass } from "./types";

export interface DiceDefinition {
  name: string;
  faces: number[];
}

export const CLASS_DICE: Record<PlayerClass, DiceDefinition> = {
  [PlayerClass.Warrior]: {
    name: "Dé de Baston",
    faces: [1, 2, 3, 4, 5, 6],
  },

  [PlayerClass.Wizard]: {
    name: "Dé Mystique",
    faces: [1, 2, 2, 3, 3, 4],
  },

  [PlayerClass.Archer]: {
    name: "Dé de Précision",
    faces: [2, 3, 4, 5, 6, 7],
  },

  [PlayerClass.Paladin]: {
    name: "Dé du Destin",
    faces: [1, 1, 2, 2, 7, 7],
  },
};

export function rollDice(
  dice: DiceDefinition,
  random: () => number = Math.random,
): number {
  const index = Math.floor(random() * dice.faces.length);

  return dice.faces[index];
}

export function rollClassDice(
  playerClass: PlayerClass,
  random: () => number = Math.random,
): number {
  return rollDice(
    CLASS_DICE[playerClass],
    random,
  );
}