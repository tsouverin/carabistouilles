import { describe, expect, it } from "vitest";
import { createGameState } from "../GameState";
import { createPlayer } from "../Player";
import {
  startTurn,
  consumeAction,
  endTurn,
} from "../Turn";
import { PlayerClass } from "../types";

function createTestGame() {
  const players = [
    createPlayer("player-1", "Alice", PlayerClass.Warrior),
    createPlayer("player-2", "Bob", PlayerClass.Paladin),
    createPlayer("player-3", "Charlie", PlayerClass.Archer),
    createPlayer("player-4", "Diana", PlayerClass.Wizard),
  ];

  return createGameState(players);
}

describe("startTurn", () => {
  it("démarre le tour du joueur et définit son nombre d'actions", () => {
    const game = createTestGame();

    const actions = startTurn(
      game,
      "player-1",
      () => 0.999999,
    );

    expect(actions).toBe(6);
    expect(game.currentPlayerId).toBe("player-1");
    expect(game.actionsRemaining).toBe(6);
    expect(game.turnNumber).toBe(1);
  });

  it("utilise le dé correspondant à la classe du joueur", () => {
    const game = createTestGame();

    const actions = startTurn(
      game,
      "player-3",
      () => 0,
    );

    expect(actions).toBe(2);
    expect(game.actionsRemaining).toBe(2);
  });

  it("incrémente le numéro de tour", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);
    endTurn(game, "player-1");

    startTurn(game, "player-2", () => 0);

    expect(game.turnNumber).toBe(2);
  });

  it("empêche de démarrer un second tour pendant qu'un tour est en cours", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);

    expect(() =>
      startTurn(game, "player-2", () => 0),
    ).toThrow("A turn is already in progress.");
  });

  it("empêche un joueur mort de commencer son tour", () => {
    const game = createTestGame();

    game.players[0].hp = 0;

    expect(() =>
      startTurn(game, "player-1", () => 0),
    ).toThrow("A dead player cannot start a turn.");
  });
});

describe("consumeAction", () => {
  it("retire une action au joueur actif", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0.999999);

    consumeAction(game, "player-1");

    expect(game.actionsRemaining).toBe(5);
  });

  it("empêche un joueur qui n'est pas actif de consommer une action", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);

    expect(() =>
      consumeAction(game, "player-2"),
    ).toThrow("This player is not currently playing.");
  });

  it("empêche de consommer une action lorsqu'il n'en reste plus", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);

    consumeAction(game, "player-1");

    expect(game.actionsRemaining).toBe(0);

    expect(() =>
      consumeAction(game, "player-1"),
    ).toThrow("No actions remaining.");
  });
});

describe("endTurn", () => {
  it("termine le tour du joueur actif", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0.999999);

    endTurn(game, "player-1");

    expect(game.currentPlayerId).toBeNull();
    expect(game.actionsRemaining).toBe(0);
  });

  it("peut terminer un tour avant d'avoir utilisé toutes les actions", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0.999999);

    consumeAction(game, "player-1");

    endTurn(game, "player-1");

    expect(game.currentPlayerId).toBeNull();
    expect(game.actionsRemaining).toBe(0);
  });

  it("empêche un autre joueur de terminer le tour", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);

    expect(() =>
      endTurn(game, "player-2"),
    ).toThrow("This player is not currently playing.");
  });
});