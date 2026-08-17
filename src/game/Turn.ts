import type { GameState } from "./GameState";
import { getPlayer } from "./Player";
import { rollClassDice } from "./Dice";
import { PlayerStatus } from "./types";

export function startTurn(
  game: GameState,
  playerId: string,
  random: () => number = Math.random,
): number {
  if (game.currentPlayerId !== null) {
    throw new Error("A turn is already in progress.");
  }

  const player = getPlayer(game.players, playerId);

if (
  player.status !== PlayerStatus.Alive ||
  player.hp <= 0
) {
  throw new Error("A dead player cannot start a turn.");
}
  const actions = rollClassDice(player.class, random);

  game.currentPlayerId = playerId;
  game.actionsRemaining = actions;
  game.turnNumber += 1;

  return actions;
}

export function consumeAction(
  game: GameState,
  playerId: string,
): void {
  if (game.currentPlayerId !== playerId) {
    throw new Error("This player is not currently playing.");
  }

  if (game.actionsRemaining <= 0) {
    throw new Error("No actions remaining.");
  }

  game.actionsRemaining -= 1;
}

export function endTurn(
  game: GameState,
  playerId: string,
): void {
  if (game.currentPlayerId !== playerId) {
    throw new Error("This player is not currently playing.");
  }

  game.currentPlayerId = null;
  game.actionsRemaining = 0;
}