import { describe, expect, it } from "vitest";
import {
  createInitialDeckCards,
  createInitialDeck,
} from "../Deck";

import { expectedDeckSize } from "../constants";
import { CardType, AttackCard, PotionCard } from "../Cards";


describe("createInitialDeckCards", () => {
  it("crée exactement 195 cartes", () => {
    const cards = createInitialDeckCards();

    expect(cards).toHaveLength(expectedDeckSize());
  });

  it("crée 80 attaques classiques", () => {
    const cards = createInitialDeckCards();

    const attacks = cards.filter(
      (card) => card.type === CardType.Attack,
    );

    expect(attacks).toHaveLength(80);
  });

  it("crée 45 potions classiques", () => {  
    const cards = createInitialDeckCards();

    const potions = cards.filter(
      (card) => card.type === CardType.Potion,
    );

    expect(potions).toHaveLength(45);
  });

  it("crée 40 attaques élémentaires", () => {
    const cards = createInitialDeckCards();

    const attacks = cards.filter(
      (card) => card.type === CardType.ElementalAttack,
    );

    expect(attacks).toHaveLength(40);
  });

  it("crée 15 potions élémentaires", () => {
    const cards = createInitialDeckCards();

    const potions = cards.filter(
      (card) => card.type === CardType.ElementalPotion,
    );

    expect(potions).toHaveLength(15);
  });

  it("crée 15 cartes de voie élémentaire", () => {
    const cards = createInitialDeckCards();

    const paths = cards.filter(
      (card) => card.type === CardType.ElementalPath,
    );

    expect(paths).toHaveLength(15);
  });

  it("ne crée aucune Carabistouille", () => {
    const cards = createInitialDeckCards();

    const tricks = cards.filter(
      (card) => card.type === CardType.Trick,
    );

    expect(tricks).toHaveLength(0);
  });

  it("donne un identifiant unique à chaque carte", () => {
    const cards = createInitialDeckCards();

    const ids = cards.map((card) => card.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(cards.length);
  });
});

describe("répartition des attaques", () => {
  it("crée 20 flèches", () => {
    const cards = createInitialDeckCards();

    const arrows = cards.filter(
      (card) =>
        card.type === CardType.Attack &&
        card.attack === AttackCard.Arrow,
    );

    expect(arrows).toHaveLength(20);
  });

  it("crée 20 gourdins", () => {
    const cards = createInitialDeckCards();

    const clubs = cards.filter(
      (card) =>
        card.type === CardType.Attack &&
        card.attack === AttackCard.Club,
    );

    expect(clubs).toHaveLength(20);
  });

  it("crée 20 épées", () => {
    const cards = createInitialDeckCards();

    const swords = cards.filter(
      (card) =>
        card.type === CardType.Attack &&
        card.attack === AttackCard.Sword,
    );

    expect(swords).toHaveLength(20);
  });

  it("crée 20 parchemins", () => {
    const cards = createInitialDeckCards();

    const scrolls = cards.filter(
      (card) =>
        card.type === CardType.Attack &&
        card.attack === AttackCard.Scroll,
    );

    expect(scrolls).toHaveLength(20);
  });
});

describe("répartition des potions", () => {
  it("crée 30 potions de vie", () => {
    const cards = createInitialDeckCards();

    const healthPotions = cards.filter(
      (card) =>
        card.type === CardType.Potion &&
        card.potion === PotionCard.Health,
    );

    expect(healthPotions).toHaveLength(30);
  });

  it("crée 15 potions de bouclier", () => {
    const cards = createInitialDeckCards();

    const shieldPotions = cards.filter(
      (card) =>
        card.type === CardType.Potion &&
        card.potion === PotionCard.Shield,
    );

    expect(shieldPotions).toHaveLength(15);
  });
});

describe("createInitialDeck", () => {
  it("crée une pioche contenant toutes les cartes", () => {
    const deck = createInitialDeck(() => 0.5);

    expect(deck.drawPile).toHaveLength(expectedDeckSize());
    expect(deck.discardPile).toHaveLength(0);
  });

  it("ne modifie pas le nombre de cartes lors du mélange", () => {
    const deck = createInitialDeck(() => 0.5);

    expect(deck.drawPile).toHaveLength(expectedDeckSize());
  });
});