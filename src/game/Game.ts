import type { GameState } from "./GameState";
import type { Player } from "./Player";
import {
  startTurn,
  endTurn,
} from "./Turn";
import {
  drawCardForPlayer,
  useCardForPlayer,
  placeHiddenCardForPlayer,
  playElementalPathForPlayer,
} from "./Actions";
import type { ClassPowerOptions } from "./ClassPowers";
import type { Element } from "./Element";
import { PlayerStatus } from "./types";

export type GameAction =
  | {
      type: "drawCard";
    }
  | {
      type: "useCard";
      cardId: string;
      targetId?: string;
      classPowerOptions?: ClassPowerOptions;
    }
  | {
      type: "placeHiddenCard";
      cardId: string;
    }
  | {
      type: "playElementalPath";
      cardId: string;
      element: Element;
    }
  | {
      type: "endTurn";
    };

export interface GameActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export function getActivePlayer(
  game: GameState,
): Player {
  if (game.currentPlayerId === null) {
    throw new Error("No active player.");
  }

  const player = game.players.find(
    (player) =>
      player.id === game.currentPlayerId,
  );

  if (!player) {
    throw new Error(
      `Active player "${game.currentPlayerId}" not found.`,
    );
  }

  return player;
}

export function getAlivePlayers(
  game: GameState,
): Player[] {
  return game.players.filter(
    (player) =>
      player.status === PlayerStatus.Alive &&
      player.hp > 0,
  );
}

export function isGameOver(
  game: GameState,
): boolean {
  return getAlivePlayers(game).length <= 1;
}

export function resolveGameOver(
  game: GameState,
): boolean {
  const alivePlayers =
    getAlivePlayers(game);

  if (alivePlayers.length > 1) {
    return false;
  }

  if (alivePlayers.length === 0) {
    throw new Error(
      "Game ended without a winner.",
    );
  }

  game.status = "finished";
  game.winnerId = alivePlayers[0].id;
  game.currentPlayerId = null;
  game.actionsRemaining = 0;

  return true;
}

export function startGame(
  game: GameState,
): void {
  if (game.status !== "waiting") {
    throw new Error(
      "Game has already started.",
    );
  }

  const firstPlayer = game.players[0];

  if (!firstPlayer) {
    throw new Error(
      "Cannot start a game without players.",
    );
  }

  game.status = "playing";

  startTurn(
    game,
    firstPlayer.id,
  );
}

export function performAction(
  game: GameState,
  action: GameAction,
): GameActionResult {
  if (game.status !== "playing") {
    throw new Error(
      "Game is not currently playing.",
    );
  }

  const player = getActivePlayer(game);

  switch (action.type) {
    case "drawCard": {
      const card = drawCardForPlayer(
        game,
        player.id,
      );

      return {
        success: true,
        data: card,
      };
    }

    case "useCard": {
      const result = useCardForPlayer(
        game,
        player.id,
        action.cardId,
        action.targetId,
        action.classPowerOptions,
      );

      resolveGameOver(game);

      return {
        success: true,
        data: result,
      };
    }

    case "placeHiddenCard": {
      const result =
        placeHiddenCardForPlayer(
          game,
          player.id,
          action.cardId,
        );

      return {
        success: true,
        data: result,
      };
    }

    case "playElementalPath": {
      const result =
        playElementalPathForPlayer(
          game,
          player.id,
          action.cardId,
          action.element,
        );

      return {
        success: true,
        data: result,
      };
    }

    case "endTurn": {
        endTurn(game, player.id);

        const gameOver =
            resolveGameOver(game);

        if (gameOver) {
            return {
            success: true,
            };
        }

        advanceToNextPlayer(
            game,
            player.id,
        );

        return {
            success: true,
        };
    }
  }
}

export function advanceToNextPlayer(
  game: GameState,
  previousPlayerId: string,
): void {
  const currentPlayerIndex =
    game.players.findIndex(
      (player) =>
        player.id === previousPlayerId,
    );

  if (currentPlayerIndex === -1) {
    throw new Error(
      `Player "${previousPlayerId}" not found.`,
    );
  }

  const playerCount =
    game.players.length;

  for (
    let offset = 1;
    offset <= playerCount;
    offset += 1
  ) {
    const nextPlayerIndex =
      (
        currentPlayerIndex +
        offset
      ) % playerCount;

    const nextPlayer =
      game.players[nextPlayerIndex];

    if (
      nextPlayer.status !==
        PlayerStatus.Alive ||
      nextPlayer.hp <= 0
    ) {
      continue;
    }

    startTurn(
      game,
      nextPlayer.id,
    );

    return;
  }

  throw new Error(
    "No living player available for the next turn.",
  );
}

export function runTurn(
  game: GameState,
  actions: GameAction[],
): void {
  for (const action of actions) {
    performAction(game, action);

    if (
      game.status === "finished" ||
      action.type === "endTurn"
    ) {
      return;
    }
  }
}
