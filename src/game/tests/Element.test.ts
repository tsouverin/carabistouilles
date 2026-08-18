import { describe, expect, it } from "vitest";
import type { GameState } from "../GameState";
import {
  Element,
  applyElementalPower,
  applyElementalShieldBreak,
  hasElementAdvantage,
} from "../Element";
import { createPlayer } from "../Player";
import { PlayerClass } from "../types";

function createTestGame(): GameState {
  const players = [
    createPlayer(
      "p1",
      "Player 1",
      PlayerClass.Warrior,
    ),
    createPlayer(
      "p2",
      "Player 2",
      PlayerClass.Paladin,
    ),
  ];

  return {
    players,
    currentPlayerId: "p1",
    actionsRemaining: 2,
    turnNumber: 1,
    deck: {
      drawPile: [],
      discardPile: [],
    },
  };
}

describe("hasElementAdvantage", () => {
  it("l'air est avantageux contre la terre", () => {
    expect(
      hasElementAdvantage(
        Element.Air,
        Element.Earth,
      ),
    ).toBe(true);
  });

  it("la terre est avantageuse contre l'eau", () => {
    expect(
      hasElementAdvantage(
        Element.Earth,
        Element.Water,
      ),
    ).toBe(true);
  });

  it("l'eau est avantageuse contre le feu", () => {
    expect(
      hasElementAdvantage(
        Element.Water,
        Element.Fire,
      ),
    ).toBe(true);
  });

  it("le feu est avantageux contre l'air", () => {
    expect(
      hasElementAdvantage(
        Element.Fire,
        Element.Air,
      ),
    ).toBe(true);
  });

  it("un élément n'est pas avantageux contre lui-même", () => {
    expect(
      hasElementAdvantage(
        Element.Fire,
        Element.Fire,
      ),
    ).toBe(false);
  });
});

describe("applyElementalShieldBreak", () => {
  it("casse un point de bouclier", () => {
    const target = { shield: 3 };

    const result =
      applyElementalShieldBreak(target);

    expect(result.shieldBroken).toBe(1);
    expect(result.remainingShield).toBe(2);
    expect(target.shield).toBe(2);
  });

  it("ne casse pas plus de bouclier que la cible n'en possède", () => {
    const target = { shield: 0 };

    const result =
      applyElementalShieldBreak(target);

    expect(result.shieldBroken).toBe(0);
    expect(result.remainingShield).toBe(0);
  });
});

describe("applyElementalPower", () => {
  it("le feu inflige un dégât bonus", () => {
    const game = createTestGame();
    const player = game.players[0];
    const target = game.players[1];

    target.shield = 0;

    const initialHp = target.hp;

    const result = applyElementalPower(
      game,
      player,
      target,
      target.id,
      Element.Fire,
    );

    expect(result.elementalPowerEffect).toBe(
      "fireBonusDamage",
    );

    expect(result.bonusDamage).toBeDefined();
    expect(target.hp).toBe(initialHp - 1);
  });

  it("l'eau ajoute un bouclier au joueur", () => {
    const game = createTestGame();
    const player = game.players[0];
    const target = game.players[1];

    const initialShield = player.shield;

    const result = applyElementalPower(
      game,
      player,
      target,
      target.id,
      Element.Water,
    );

    expect(result.elementalPowerEffect).toBe(
      "waterShieldHeal",
    );

    expect(result.bonusHealing).toBeDefined();
    expect(player.shield).toBe(
      initialShield + 1,
    );
  });

  it("la terre casse le bouclier de la cible", () => {
    const game = createTestGame();
    const player = game.players[0];
    const target = game.players[1];

    target.shield = 3;

    const result = applyElementalPower(
      game,
      player,
      target,
      target.id,
      Element.Earth,
      {
        shieldBreakTargetId: target.id,
      },
    );

    expect(result.elementalPowerEffect).toBe(
      "earthShieldBreak",
    );

    expect(
      result.bonusShieldBreak,
    ).toBeDefined();

    expect(target.shield).toBe(2);
  });

  it("la terre peut cibler un autre joueur", () => {
    const game = createTestGame();
    const player = game.players[0];
    const target = game.players[1];

    player.shield = 3;
    target.shield = 3;

    const result = applyElementalPower(
      game,
      player,
      target,
      target.id,
      Element.Earth,
      {
        shieldBreakTargetId: target.id,
      },
    );

    expect(result.elementalPowerEffect).toBe(
      "earthShieldBreak",
    );

    expect(result.bonusShieldBreak).toBeDefined();
    expect(target.shield).toBe(2);
    expect(player.shield).toBe(3);
  });

  it("l'air fait piocher une carte", () => {
    const game = createTestGame();
    const player = game.players[0];
    const target = game.players[1];

    const card = {
      id: "air-card",
      name: "Carte test",
      type: "attack" as const,
      attack: "arrow" as const,
    };

    game.deck.drawPile.push(card);

    const initialHandSize =
      player.hand.length;

    const result = applyElementalPower(
      game,
      player,
      target,
      target.id,
      Element.Air,
    );

    expect(result.elementalPowerEffect).toBe(
      "airCardDraw",
    );

    expect(result.drawnCardId).toBe(
      "air-card",
    );

    expect(player.hand).toHaveLength(
      initialHandSize + 1,
    );
  });

  it("l'air ne provoque pas d'erreur si la pioche est vide", () => {
    const game = createTestGame();
    const player = game.players[0];
    const target = game.players[1];

    const result = applyElementalPower(
      game,
      player,
      target,
      target.id,
      Element.Air,
    );

    expect(result.elementalPowerEffect).toBe(
      "airCardDraw",
    );

    expect(
      result.drawnCardId,
    ).toBeUndefined();
  });
});
