import { describe, expect, it } from "vitest";
import {
  Element,
} from "../Element";
import {
  AttackCard,
  CardType,
} from "../Cards";
import { PlayerClass } from "../types";
import { createPlayer } from "../Player";
import {
  useCardForPlayer,
} from "../Actions";
import type { GameState } from "../GameState";

function createTestGame(
  playerClass: PlayerClass,
  attack: AttackCard,
): GameState {
  const player = createPlayer(
    "p1",
    "Player 1",
    playerClass,
  );

  const target = createPlayer(
    "p2",
    "Player 2",
    PlayerClass.Warrior,
  );

  player.element = Element.Fire;

  player.hand.push({
    id: "elemental-attack",
    name: "Attaque élémentaire",
    type: CardType.ElementalAttack,
    attack,
  });

  return {
    players: [player, target],
    currentPlayerId: player.id,
    actionsRemaining: 1,
    turnNumber: 1,
    deck: {
      drawPile: [],
      discardPile: [],
    },
  };
}

describe("interactions attaques élémentaires + pouvoirs de classe", () => {
  it("Guerrier : le gourdin élémentaire déclenche le pouvoir de classe et la voie élémentaire", () => {
    const game = createTestGame(
      PlayerClass.Warrior,
      AttackCard.Club,
    );

    const player = game.players[0];
    const target = game.players[1];

    target.shield = 0;

    const initialHp = target.hp;

    const result = useCardForPlayer(
      game,
      player.id,
      "elemental-attack",
      target.id,
    );

    expect(result.cardType).toBe(
      CardType.ElementalAttack,
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBeDefined();
    expect(result.bonusDamage).toBeDefined();

    expect(target.hp).toBeLessThan(initialHp);
    expect(player.hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("Paladin : l'épée élémentaire déclenche le pouvoir de classe et la voie élémentaire", () => {
    const game = createTestGame(
      PlayerClass.Paladin,
      AttackCard.Sword,
    );

    const player = game.players[0];
    const target = game.players[1];

    target.shield = 0;

    const initialShield = player.shield;

    const result = useCardForPlayer(
      game,
      player.id,
      "elemental-attack",
      target.id,
    );

    expect(result.cardType).toBe(
      CardType.ElementalAttack,
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBeDefined();

    expect(result.bonusDamage).toBeDefined();
    expect(result.bonusHealing).toBeDefined();

    expect(player.shield).toBeGreaterThan(
      initialShield,
    );

    expect(player.hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("Archer : la flèche élémentaire déclenche le pouvoir de classe et la voie élémentaire", () => {
    const game = createTestGame(
      PlayerClass.Archer,
      AttackCard.Arrow,
    );

    const player = game.players[0];
    const target = game.players[1];

    target.shield = 0;

    const initialHp = target.hp;

    const result = useCardForPlayer(
      game,
      player.id,
      "elemental-attack",
      target.id,
    );

    expect(result.cardType).toBe(
      CardType.ElementalAttack,
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBeDefined();

    expect(result.bonusDamage).toBeDefined();

    expect(target.hp).toBeLessThan(initialHp);

    expect(player.hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("Sorcier : le parchemin élémentaire déclenche le pouvoir de classe et la voie élémentaire", () => {
    const game = createTestGame(
      PlayerClass.Wizard,
      AttackCard.Scroll,
    );

    const player = game.players[0];
    const target = game.players[1];

    target.shield = 0;

    const initialHp = target.hp;

    const result = useCardForPlayer(
      game,
      player.id,
      "elemental-attack",
      target.id,
      {
        elementalElement: Element.Fire,
      },
    );

    expect(result.cardType).toBe(
      CardType.ElementalAttack,
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBeDefined();

    expect(result.bonusDamage).toBeDefined();

    expect(target.hp).toBeLessThan(initialHp);

    expect(player.hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });
});