import type { Player } from "./Player";
import type { Deck } from "./Deck";
import { createInitialDeck } from "./Deck";

export type GameStatus =
  | "waiting"
  | "playing"
  | "finished";

export interface GameState {
  players: Player[];

  deck: Deck;

  currentPlayerId: string | null;
  actionsRemaining: number;

  turnNumber: number;

  status: GameStatus;
  winnerId: string | null;
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

    status: "waiting",
    winnerId: null,
  };
}