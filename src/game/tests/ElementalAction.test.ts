import { describe, expect, it } from "vitest";

import {
  useCardForPlayer,
} from "../Actions";
import { createGameState } from "../GameState";
import { createPlayer } from "../Player";
import { createDeck } from "../Deck";
import {
  AttackCard,
  CardType,
  PotionCard,
  type Card,
} from "../Cards";
import { Element } from "../Element";
import { PlayerClass } from "../types";
import { startTurn } from "../Turn";

function createTestGame() {
  const players = [
    createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    ),
    createPlayer(
      "player-2",
      "Bob",
      PlayerClass.Paladin,
    ),
    createPlayer(
      "player-3",
      "Charlie",
      PlayerClass.Archer,
    ),
    createPlayer(
      "player-4",
      "Diana",
      PlayerClass.Wizard,
    ),
  ];

  const game = createGameState(players);
  game.deck = createDeck();

  return game;
}

function createElementalAttackCard(
  id: string,
  attack: AttackCard,
): Card {
  return {
    id,
    name: `Attaque élémentaire ${id}`,
    type: CardType.ElementalAttack,
    attack,
  };
}

function createElementalPotionCard(
  id: string,
  potion: PotionCard,
): Card {
  return {
    id,
    name: `Potion élémentaire ${id}`,
    type: CardType.ElementalPotion,
    potion,
  };
}

describe("attaques élémentaires", () => {
  it("utilise la voie élémentaire du joueur", () => {
    const game = createTestGame();

    game.players[0].element = Element.Fire;

    const card = createElementalAttackCard(
      "elemental-attack-1",
      AttackCard.Arrow,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "elemental-attack-1",
      "player-2",
    );

    expect(result.cardType).toBe(
      CardType.ElementalAttack,
    );

    expect(game.players[1].hp).toBe(10);
    expect(game.players[1].shield).toBeLessThan(5);

    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("ne dépend pas d'un élément inscrit sur la carte", () => {
    const game = createTestGame();

    game.players[0].element = Element.Water;

    const card = createElementalAttackCard(
      "elemental-attack-2",
      AttackCard.Club,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "elemental-attack-2",
      "player-2",
    );

    expect(result.cardType).toBe(
      CardType.ElementalAttack,
    );

    // La carte ne possède aucune propriété `element`.
    expect(card).not.toHaveProperty("element");
  });

  it("consomme la carte après utilisation", () => {
    const game = createTestGame();

    game.players[0].element = Element.Fire;

    const card = createElementalAttackCard(
      "elemental-attack-3",
      AttackCard.Sword,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    useCardForPlayer(
      game,
      "player-1",
      "elemental-attack-3",
      "player-2",
    );

    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
    expect(game.deck.discardPile[0].id).toBe(
      "elemental-attack-3",
    );
  });
});

describe("potions élémentaires", () => {
  it("peut utiliser une potion élémentaire de vie", () => {
    const game = createTestGame();

    game.players[0].element = Element.Fire;
    game.players[0].hp = 5;

    const card = createElementalPotionCard(
      "elemental-potion-hp-1",
      PotionCard.Health,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "elemental-potion-hp-1",
    );

    expect(result.cardType).toBe(
      CardType.ElementalPotion,
    );

    expect(game.players[0].hp).toBeGreaterThan(5);
    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("peut utiliser une potion élémentaire de bouclier", () => {
    const game = createTestGame();

    game.players[0].element = Element.Water;
    game.players[0].shield = 3;

    const card = createElementalPotionCard(
      "elemental-potion-shield-1",
      PotionCard.Shield,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "elemental-potion-shield-1",
    );

    expect(result.cardType).toBe(
      CardType.ElementalPotion,
    );

    expect(game.players[0].shield).toBeGreaterThan(3);
    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("respecte le plafond de bouclier", () => {
    const game = createTestGame();

    game.players[0].element = Element.Water;
    game.players[0].shield = 9;

    const card = createElementalPotionCard(
      "elemental-potion-shield-2",
      PotionCard.Shield,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    useCardForPlayer(
      game,
      "player-1",
      "elemental-potion-shield-2",
    );

    expect(game.players[0].shield).toBe(10);
  });

  it("consomme la carte après utilisation", () => {
    const game = createTestGame();

    game.players[0].element = Element.Fire;

    const card = createElementalPotionCard(
      "elemental-potion-3",
      PotionCard.Health,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    useCardForPlayer(
      game,
      "player-1",
      "elemental-potion-3",
    );

    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
  });
});