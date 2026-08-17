import { describe, expect, it } from "vitest";
import {
  createGameState,
} from "../GameState";
import { createPlayer } from "../Player";
import { PlayerClass } from "../types";
import { expectedDeckSize } from "../constants";

it("crée les joueurs sans carte en main", () => {
  const players = [
    createPlayer("player-1", "Alice", PlayerClass.Warrior),
    createPlayer("player-2", "Bob", PlayerClass.Paladin),
    createPlayer("player-3", "Charlie", PlayerClass.Archer),
    createPlayer("player-4", "Diana", PlayerClass.Wizard),
  ];

  const game = createGameState(players);

  for (const player of game.players) {
    expect(player.hand).toHaveLength(0);
    expect(player.hiddenCards).toHaveLength(0);
  }
});

it("crée une partie avec le deck initial complet", () => {
  const players = [
    createPlayer("player-1", "Alice", PlayerClass.Warrior),
    createPlayer("player-2", "Bob", PlayerClass.Paladin),
    createPlayer("player-3", "Charlie", PlayerClass.Archer),
    createPlayer("player-4", "Diana", PlayerClass.Wizard),
  ];

  const game = createGameState(players);

  expect(game.deck.drawPile).toHaveLength(
    expectedDeckSize(),
  );

  expect(game.deck.discardPile).toHaveLength(0);
});

describe("createGameState", () => {
  it("crée une partie avec quatre joueurs", () => {
    const players = [
      createPlayer("player-1", "Alice", PlayerClass.Warrior),
      createPlayer("player-2", "Bob", PlayerClass.Paladin),
      createPlayer("player-3", "Charlie", PlayerClass.Archer),
      createPlayer("player-4", "Diana", PlayerClass.Wizard),
    ];

    const game = createGameState(players);

    expect(game.players).toHaveLength(4);
    expect(game.deck.drawPile).toHaveLength(expectedDeckSize());

    expect(game.deck.discardPile).toHaveLength(0);

    expect(game.currentPlayerId).toBeNull();
    expect(game.actionsRemaining).toBe(0);
    expect(game.turnNumber).toBe(0);
  });

  it("refuse une partie qui ne contient pas exactement quatre joueurs", () => {
    const players = [
      createPlayer("player-1", "Alice", PlayerClass.Warrior),
      createPlayer("player-2", "Bob", PlayerClass.Paladin),
      createPlayer("player-3", "Charlie", PlayerClass.Archer),
    ];

    expect(() => createGameState(players)).toThrow(
      "A game requires exactly 4 players.",
    );
  });
});