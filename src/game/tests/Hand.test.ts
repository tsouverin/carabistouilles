import { describe, expect, it } from "vitest";
import { createPlayer } from "../Player";
import { PlayerClass } from "../types";
import {
  addCardToHand,
  hasCard,
  removeCardFromHand,
} from "../Hand";
import {
  AttackCard,
  CardType,
  type Card,
} from "../Cards";

function createTestPlayer() {
  return createPlayer(
    "player-1",
    "Alice",
    PlayerClass.Warrior,
  );
}

function createTestCard(id: string): Card {
  return {
    id,
    name: `Flèche ${id}`,
    type: CardType.Attack,
    attack: AttackCard.Arrow,
  };
}

describe("addCardToHand", () => {
  it("ajoute une carte à la main", () => {
    const player = createTestPlayer();
    const card = createTestCard("card-1");

    addCardToHand(player, card);

    expect(player.hand).toHaveLength(1);
    expect(player.hand[0]).toBe(card);
  });
});

describe("hasCard", () => {
  it("détecte une carte présente dans la main", () => {
    const player = createTestPlayer();
    const card = createTestCard("card-1");

    addCardToHand(player, card);

    expect(hasCard(player, "card-1")).toBe(true);
  });

  it("retourne false lorsque la carte n'est pas dans la main", () => {
    const player = createTestPlayer();

    expect(hasCard(player, "card-1")).toBe(false);
  });
});

describe("removeCardFromHand", () => {
  it("retire une carte de la main", () => {
    const player = createTestPlayer();
    const card = createTestCard("card-1");

    addCardToHand(player, card);

    const removed = removeCardFromHand(
      player,
      "card-1",
    );

    expect(removed).toBe(card);
    expect(player.hand).toHaveLength(0);
  });

  it("ne retire que la carte demandée", () => {
    const player = createTestPlayer();

    const card1 = createTestCard("card-1");
    const card2 = createTestCard("card-2");

    addCardToHand(player, card1);
    addCardToHand(player, card2);

    removeCardFromHand(player, "card-1");

    expect(player.hand).toHaveLength(1);
    expect(player.hand[0]).toBe(card2);
  });

  it("refuse de retirer une carte absente", () => {
    const player = createTestPlayer();

    expect(() =>
      removeCardFromHand(player, "card-404"),
    ).toThrow("Card is not in player's hand.");
  });
});