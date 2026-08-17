import type { Element } from "./Element";
import { GAME_CONSTANTS } from "./constants";
import { PlayerClass, PlayerStatus } from "./types";
import type { Card } from "./Cards";

export interface Player {
  id: string;
  name: string;
  class: PlayerClass;

  hp: number;
  shield: number;

  element: Element | null;

  hand: Card[];
  hiddenCards: Card[];

  status: PlayerStatus;
}

export function createPlayer(
  id: string,
  name: string,
  playerClass: PlayerClass,
): Player {
  return {
    id,
    name,
    class: playerClass,

    hp: GAME_CONSTANTS.startingHp,
    shield: GAME_CONSTANTS.startingShield,

    element: null,

    hand: [],
    hiddenCards: [],

    status: PlayerStatus.Alive,
  };
}

export function getPlayer(
  players: Player[],
  playerId: string,
): Player {
  const player = players.find(
    (player) => player.id === playerId,
  );

  if (!player) {
    throw new Error(`Player "${playerId}" not found.`);
  }

  return player;
}