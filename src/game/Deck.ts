import {
  AttackCard,
  CardType,
  PotionCard,
  type Card,
} from "./Cards";
import { INITIAL_DECK_CONFIG } from "./constants";

export interface Deck {
  drawPile: Card[];
  discardPile: Card[];
}

export function createDeck(cards: Card[] = []): Deck {
  return {
    drawPile: [...cards],
    discardPile: [],
  };
}

function createCardId(
  category: string,
  kind: string,
  index: number,
): string {
  return `${category}-${kind}-${String(index).padStart(3, "0")}`;
}

function createAttackCards(): Card[] {
  const cards: Card[] = [];

  for (const [attack, count] of Object.entries(
    INITIAL_DECK_CONFIG.attacks,
  )) {
    for (let i = 1; i <= count; i += 1) {
      cards.push({
        id: createCardId("attack", attack, i),
        name: `Attaque ${attack} ${i}`,
        type: CardType.Attack,
        attack: attack as AttackCard,
      });
    }
  }

  return cards;
}

function createPotionCards(): Card[] {
  const cards: Card[] = [];

  for (const [potion, count] of Object.entries(
    INITIAL_DECK_CONFIG.potions,
  )) {
    for (let i = 1; i <= count; i += 1) {
      cards.push({
        id: createCardId("potion", potion, i),
        name: `Potion ${potion} ${i}`,
        type: CardType.Potion,
        potion: potion as PotionCard,
      });
    }
  }

  return cards;
}

function createElementalAttackCards(): Card[] {
  const cards: Card[] = [];

  for (const [attack, count] of Object.entries(
    INITIAL_DECK_CONFIG.elementalAttack,
  )) {
    for (let i = 1; i <= count; i += 1) {
      cards.push({
        id: createCardId("elemental-attack", attack, i),
        name: `Attaque élémentaire ${attack} ${i}`,
        type: CardType.ElementalAttack,
        attack: attack as AttackCard,
      });
    }
  }

  return cards;
}

function createElementalPotionCards(): Card[] {
  const cards: Card[] = [];

  for (const [potion, count] of Object.entries(
    INITIAL_DECK_CONFIG.elementalPotion,
  )) {
    for (let i = 1; i <= count; i += 1) {
      cards.push({
        id: createCardId("elemental-potion", potion, i),
        name: `Potion élémentaire ${potion} ${i}`,
        type: CardType.ElementalPotion,
        potion: potion as PotionCard,
      });
    }
  }

  return cards;
}

function createElementalPathCards(): Card[] {
  const cards: Card[] = [];

  for (
    let i = 1;
    i <= INITIAL_DECK_CONFIG.elementalPath;
    i += 1
  ) {
    cards.push({
      id: createCardId("elemental-path", "path", i),
      name: `Voie élémentaire ${i}`,
      type: CardType.ElementalPath,
    });
  }

  return cards;
}

function createTrickCards(): Card[] {
  const cards: Card[] = [];

  for (
    let i = 1;
    i <= INITIAL_DECK_CONFIG.trick;
    i += 1
  ) {
    cards.push({
      id: createCardId("trick", "trick", i),
      name: `Carabistouille ${i}`,
      type: CardType.Trick,
    });
  }

  return cards;
}

export function createInitialDeckCards(): Card[] {
  return [
    ...createAttackCards(),
    ...createPotionCards(),
    ...createElementalAttackCards(),
    ...createElementalPotionCards(),
    ...createElementalPathCards(),
    ...createTrickCards(),
  ];
}

export function createInitialDeck(
  random: () => number = Math.random,
): Deck {
  const cards = createInitialDeckCards();

  shuffleCards(cards, random);

  return createDeck(cards);
}

export function drawCard(
  deck: Deck,
  random: () => number = Math.random,
): Card | null {
  if (deck.drawPile.length === 0) {
    reshuffleDiscard(deck, random);
  }

  if (deck.drawPile.length === 0) {
    return null;
  }

  return deck.drawPile.pop() ?? null;
}

export function discardCard(
  deck: Deck,
  card: Card,
): void {
  deck.discardPile.push(card);
}

export function shuffleCards(
  cards: Card[],
  random: () => number = Math.random,
): void {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));

    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

export function reshuffleDiscard(
  deck: Deck,
  random: () => number = Math.random,
): void {
  if (deck.discardPile.length === 0) {
    return;
  }

  deck.drawPile.push(...deck.discardPile);
  deck.discardPile.length = 0;

  shuffleCards(deck.drawPile, random);
}