import type { GameState } from "./GameState";
import { GAME_CONSTANTS } from "./constants";
import type { ElementalShieldBreakResult } from "./Element";
import { getPlayer } from "./Player";
import { discardCard, drawCard } from "./Deck";
import {
  addCardToHand,
  removeCardFromHand,
} from "./Hand";
import { consumeAction } from "./Turn";
import {
  CardType,
  getAttackCardDamage,
  getPotionCardHealing,
  isAssociatedAttackForClass,
  isDirectlyPlayableCard,
} from "./Cards";
import { PlayerClass } from "./types";
import {
  applyDamage,
  type DamageResult,
} from "./Damage";
import {
  applyHealing,
  type HealingResult,
} from "./Healing";
import {
  applyClassPower,
  type ClassPowerEffect,
  type ClassPowerOptions,
} from "./ClassPowers";

export interface UseCardResult {
  cardId: string;
  cardType: CardType;
  targetId: string;
  damage?: DamageResult;
  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;
  drawnCardId?: string;
  classPowerEffect?: ClassPowerEffect;
  classPowerTriggered?: boolean;
  healing?: HealingResult;
}

export type UseCardClassPowerOptions = ClassPowerOptions;

export interface PlaceHiddenCardResult {
  cardId: string;
  hiddenCardsCount: number;
}


export function drawCardForPlayer(
  game: GameState,
  playerId: string,
  random: () => number = Math.random,
): void {
  const player = getPlayer(game.players, playerId);

  consumeAction(game, playerId);

  const card = drawCard(game.deck, random);

  if (card === null) {
    return;
  }

  addCardToHand(player, card);
}

export function useCardForPlayer(
  game: GameState,
  playerId: string,
  cardId: string,
  targetId?: string,
  classPowerOptions?: UseCardClassPowerOptions,
): UseCardResult {
  const player = getPlayer(game.players, playerId);

  const cardInHand = player.hand.find(
    (card) => card.id === cardId,
  );

  if (!cardInHand) {
    throw new Error("Card is not in player's hand.");
  }

  if (!isDirectlyPlayableCard(cardInHand)) {
    throw new Error(
      "This card type cannot be used yet.",
    );
  }

  if (
    cardInHand.type === CardType.Attack &&
    !targetId
  ) {
    throw new Error(
      "Attack cards require a target.",
    );
  }

  if (
    cardInHand.type === CardType.Attack &&
    isAssociatedAttackForClass(
      player.class,
      cardInHand.attack,
    ) &&
    player.class === PlayerClass.Wizard &&
    !classPowerOptions?.wizardElement
  ) {
    throw new Error(
      "Wizard must choose an elemental passive.",
    );
  }

  consumeAction(game, playerId);

  const removedCard = removeCardFromHand(player, cardId);

  if (cardInHand.type === CardType.Attack) {
    const resolvedTargetId = targetId as string;
    const target = getPlayer(
      game.players,
      resolvedTargetId,
    );

    const damage = applyDamage(target, {
      sourceId: playerId,
      targetId: resolvedTargetId,
      amount: getAttackCardDamage(cardInHand.attack),
    });

    let bonusDamage: DamageResult | undefined;
    let bonusHealing: HealingResult | undefined;
    let bonusShieldBreak: ElementalShieldBreakResult | undefined;
    let drawnCardId: string | undefined;
    let classPowerEffect: ClassPowerEffect | undefined;
    const classPowerTriggered = isAssociatedAttackForClass(
      player.class,
      cardInHand.attack,
    );

    if (classPowerTriggered) {
      const result = applyClassPower(
        game,
        player,
        target,
        resolvedTargetId,
        classPowerOptions,
      );

      classPowerEffect = result.classPowerEffect;
      bonusDamage = result.bonusDamage;
      bonusHealing = result.bonusHealing;
      bonusShieldBreak = result.bonusShieldBreak;
      drawnCardId = result.drawnCardId;
    }

    discardCard(game.deck, removedCard);

    return {
      cardId: removedCard.id,
      cardType: cardInHand.type,
      targetId: resolvedTargetId,
      damage,
      bonusDamage,
      bonusHealing,
      bonusShieldBreak,
      drawnCardId,
      classPowerEffect,
      classPowerTriggered,
    };
  }

  const resolvedTargetId = targetId ?? playerId;
  const target = getPlayer(game.players, resolvedTargetId);

  const healing = applyHealing(target, {
    targetId: resolvedTargetId,
    amount: getPotionCardHealing(cardInHand.potion),
    type:
      cardInHand.potion === "health" ? "hp" : "shield",
  });

  discardCard(game.deck, removedCard);

  return {
    cardId: removedCard.id,
    cardType: cardInHand.type,
    targetId: resolvedTargetId,
    healing,
  };
}

export function placeHiddenCardForPlayer(
  game: GameState,
  playerId: string,
  cardId: string,
): PlaceHiddenCardResult {
  if (game.currentPlayerId !== playerId) {
    throw new Error("This player is not currently playing.");
  }

  const player = getPlayer(game.players, playerId);

  const cardInHand = player.hand.find(
    (card) => card.id === cardId,
  );

  if (!cardInHand) {
    throw new Error("Card is not in player's hand.");
  }

  if (
    player.hiddenCards.length >=
    GAME_CONSTANTS.maxHiddenCards
  ) {
    throw new Error("Hidden card limit reached.");
  }

  consumeAction(game, playerId);

  const hiddenCard = removeCardFromHand(player, cardId);
  player.hiddenCards.push(hiddenCard);

  return {
    cardId: hiddenCard.id,
    hiddenCardsCount: player.hiddenCards.length,
  };
}