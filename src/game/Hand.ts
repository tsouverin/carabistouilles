import type { Card } from "./Cards";
import type { Player } from "./Player";

export function addCardToHand(
  player: Player,
  card: Card,
): void {
  player.hand.push(card);
}

export function removeCardFromHand(
  player: Player,
  cardId: string,
): Card {
  const index = player.hand.findIndex(
    (card) => card.id === cardId,
  );

  if (index === -1) {
    throw new Error("Card is not in player's hand.");
  }

  const [card] = player.hand.splice(index, 1);

  return card;
}

export function hasCard(
  player: Player,
  cardId: string,
): boolean {
  return player.hand.some(
    (card) => card.id === cardId,
  );
}