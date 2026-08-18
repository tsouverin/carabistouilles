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

function createCardsFromCounts<K extends string>(
  category: string,
  counts: Record<K, number>,
  buildCard: (kind: K, id: string) => Card,
): Card[] {
  const cards: Card[] = [];

  for (const [kind, count] of Object.entries(counts) as [
    K,
    number,
  ][]) {
    for (let i = 1; i <= count; i += 1) {
      cards.push(
        buildCard(kind, createCardId(category, kind, i)),
      );
    }
  }

  return cards;
}

function createAttackCards(): Card[] {
  return createCardsFromCounts(
    "attack",
    INITIAL_DECK_CONFIG.attacks,
    (attack, id) => ({
      id,
      name: `Attaque ${attack} ${id}`,
      type: CardType.Attack,
      attack: attack as AttackCard,
    }),
  );
}

function createPotionCards(): Card[] {
  return createCardsFromCounts(
    "potion",
    INITIAL_DECK_CONFIG.potions,
    (potion, id) => ({
      id,
      name: `Potion ${potion} ${id}`,
      type: CardType.Potion,
      potion: potion as PotionCard,
    }),
  );
}

function createElementalAttackCards(): Card[] {
  return createCardsFromCounts(
    "elemental-attack",
    INITIAL_DECK_CONFIG.elementalAttack,
    (attack, id) => ({
      id,
      name: `Attaque élémentaire ${attack} ${id}`,
      type: CardType.ElementalAttack,
      attack: attack as AttackCard,
    }),
  );
}

function createElementalPotionCards(): Card[] {
  return createCardsFromCounts(
    "elemental-potion",
    INITIAL_DECK_CONFIG.elementalPotion,
    (potion, id) => ({
      id,
      name: `Potion élémentaire ${potion} ${id}`,
      type: CardType.ElementalPotion,
      potion: potion as PotionCard,
    }),
  );
}

function createElementalPathCards(): Card[] {
  return createCardsFromCounts(
    "elemental-path",
    { path: INITIAL_DECK_CONFIG.elementalPath },
    (_kind, id) => ({
      id,
      name: `Voie élémentaire ${id}`,
      type: CardType.ElementalPath,
    }),
  );
}

function createTrickCards(): Card[] {
  return createCardsFromCounts(
    "trick",
    { trick: INITIAL_DECK_CONFIG.trick },
    (_kind, id) => ({
      id,
      name: `Carabistouille ${id}`,
      type: CardType.Trick,
    }),
  );
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