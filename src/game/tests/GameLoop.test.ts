import { describe, expect, it } from "vitest";

import {
  createGameState,
} from "../GameState";

import {
  startGame,
  performAction,
  advanceToNextPlayer,
  runTurn,
  getActivePlayer,
  type GameAction,
} from "../Game";

import {
  PlayerClass,
} from "../types";

import {
  createPlayer,
  type Player,
} from "../Player";

import type { GameState } from "../GameState";

describe("Game loop", () => {
  function createTestPlayers(): Player[] {
    return [
      createPlayer(
        "player-1",
        "Joueur 1",
        PlayerClass.Warrior,
      ),
      createPlayer(
        "player-2",
        "Joueur 2",
        PlayerClass.Paladin,
      ),
      createPlayer(
        "player-3",
        "Joueur 3",
        PlayerClass.Archer,
      ),
      createPlayer(
        "player-4",
        "Joueur 4",
        PlayerClass.Wizard,
      ),
    ];
  }

  function createTestGame(): GameState {
    return createGameState(
      createTestPlayers(),
    );
  }

  describe("startGame", () => {
    it("démarre la partie sans distribuer de cartes", () => {
        const game = createTestGame();

        startGame(game);

        for (const player of game.players) {
            expect(player.hand).toHaveLength(0);
        }

        expect(game.currentPlayerId).toBe(
            "player-1",
        );

        expect(game.actionsRemaining).toBeGreaterThan(0);
    });

    it("désigne le premier joueur comme joueur actif", () => {
      const game = createTestGame();

      startGame(game);

      expect(game.currentPlayerId).toBe(
        "player-1",
      );
    });

    it("démarre le tour du premier joueur", () => {
      const game = createTestGame();

      startGame(game);

      const player = getActivePlayer(game);

      expect(player.id).toBe("player-1");
      expect(
        game.actionsRemaining,
      ).toBeGreaterThan(0);
    });

    it("refuse de démarrer une partie déjà commencée", () => {
      const game = createTestGame();

      startGame(game);

      expect(() =>
        startGame(game),
      ).toThrow(
        "Game has already started.",
      );
    });
  });

  describe("performAction", () => {
    it("exécute une action du joueur actif", () => {
      const game = createTestGame();

      startGame(game);

      const initialActions =
        game.actionsRemaining;

      const result = performAction(
        game,
        {
          type: "drawCard",
        },
      );

      expect(result.success).toBe(true);

      expect(
        game.actionsRemaining,
      ).toBe(initialActions - 1);
    });

    it("exécute une séquence d'actions jusqu'à la fin du tour", () => {
      const game = createTestGame();

      startGame(game);

      const actions: GameAction[] = [
        {
          type: "drawCard",
        },
        {
          type: "endTurn",
        },
      ];

      runTurn(game, actions);

      expect(
        game.currentPlayerId,
      ).toBe("player-2");
    });

    it("ne change pas de joueur tant que le tour n'est pas terminé", () => {
      const game = createTestGame();

      startGame(game);

      performAction(game, {
        type: "drawCard",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-1");
    });

    it("passe au joueur suivant à la fin du tour", () => {
      const game = createTestGame();

      startGame(game);

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-2");
    });

    it("revient au premier joueur après le dernier", () => {
      const game = createTestGame();

      startGame(game);

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-2");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-3");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-4");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-1");
    });

    it("démarre le tour du joueur suivant", () => {
      const game = createTestGame();

      startGame(game);

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-2");

      expect(
        game.actionsRemaining,
      ).toBeGreaterThan(0);

      expect(
        game.turnNumber,
      ).toBe(2);
    });

    it("fait tourner les joueurs dans l'ordre", () => {
      const game = createTestGame();

      startGame(game);

      expect(
        game.currentPlayerId,
      ).toBe("player-1");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-2");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-3");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-4");

      performAction(game, {
        type: "endTurn",
      });

      expect(
        game.currentPlayerId,
      ).toBe("player-1");
    });
  });

  describe("runTurn", () => {
    it("exécute toutes les actions avant endTurn", () => {
      const game = createTestGame();

      startGame(game);

      const firstPlayer =
        game.players[0];

      runTurn(game, [
        {
          type: "drawCard",
        },
        {
          type: "drawCard",
        },
        {
          type: "endTurn",
        },
      ]);

      expect(
        firstPlayer.hand,
      ).toHaveLength(2);

      expect(
        game.currentPlayerId,
      ).toBe("player-2");
    });

    it("arrête la séquence dès que le tour est terminé", () => {
      const game = createTestGame();

      startGame(game);

      expect(() =>
        runTurn(game, [
          {
            type: "endTurn",
          },
          {
            type: "drawCard",
          },
        ]),
      ).not.toThrow();

      expect(
        game.currentPlayerId,
      ).toBe("player-2");

      expect(
        game.players[0].hand,
      ).toHaveLength(0);
    });

    it("conserve les modifications du jeu entre les tours", () => {
      const game = createTestGame();

      startGame(game);

      const firstPlayer =
        getActivePlayer(game);

      runTurn(game, [
        {
          type: "drawCard",
        },
        {
          type: "endTurn",
        },
      ]);

      const secondPlayer =
        getActivePlayer(game);

      expect(
        secondPlayer.id,
      ).toBe("player-2");

      expect(
        firstPlayer.hand,
      ).toHaveLength(1);
    });
  });
});