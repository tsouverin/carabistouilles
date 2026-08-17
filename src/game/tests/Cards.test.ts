import { describe, expect, it } from "vitest";
import {
  AttackCard,
  CardType,
  PotionCard,
  type Card,
} from "../Cards";

describe("Card", () => {
  it("représente une carte d'attaque", () => {
    const card: Card = {
      id: "card-001",
      name: "Flèche",
      type: CardType.Attack,
      attack: AttackCard.Arrow,
    };

    expect(card.type).toBe(CardType.Attack);
    expect(card.attack).toBe(AttackCard.Arrow);
  });

  it("représente une potion", () => {
    const card: Card = {
      id: "card-002",
      name: "Potion de vie",
      type: CardType.Potion,
      potion: PotionCard.Health,
    };

    expect(card.type).toBe(CardType.Potion);
    expect(card.potion).toBe(PotionCard.Health);
  });

  it("représente une attaque élémentaire", () => {
    const card: Card = {
      id: "card-003",
      name: "Flèche de feu",
      type: CardType.ElementalAttack,
      attack: AttackCard.Arrow,
    };

    expect(card.type).toBe(CardType.ElementalAttack);
  });

  it("représente une potion élémentaire", () => {
    const card: Card = {
      id: "card-004",
      name: "Potion de bouclier de terre",
      type: CardType.ElementalPotion,
      potion: PotionCard.Shield,
    };

    expect(card.type).toBe(CardType.ElementalPotion);
    expect(card.potion).toBe(PotionCard.Shield);
  });

  it("représente une carte de voie élémentaire", () => {
    const card: Card = {
      id: "card-005",
      name: "Voie du feu",
      type: CardType.ElementalPath,
    };

    expect(card.type).toBe(CardType.ElementalPath);
  });

  it("représente une Carabistouille", () => {
    const card: Card = {
      id: "card-006",
      name: "Voleur de cartes",
      type: CardType.Trick,
    };

    expect(card.type).toBe(CardType.Trick);
  });
});