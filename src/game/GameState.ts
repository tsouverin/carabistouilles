import type { Player } from "./Player";
import type { Deck } from "./Deck";
import { createInitialDeck } from "./Deck";

export interface GameState {
  players: Player[];

  deck: Deck;

  currentPlayerId: string | null;
  actionsRemaining: number;

  turnNumber: number;
}

export function createGameState(
  players: Player[],
): GameState {
  if (players.length !== 4) {
    throw new Error(
      "A game requires exactly 4 players.",
    );
  }

  return {
    players,

    deck: createInitialDeck(),

    currentPlayerId: null,
    actionsRemaining: 0,

    turnNumber: 0,
  };
}