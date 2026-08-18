import type { GameState } from "./GameState";
import { GAME_CONSTANTS } from "./constants";

import {
  Element,
  applyElementalPower,
  type ElementalPowerEffect,
  type ElementalShieldBreakResult,
} from "./Element";

import { getPlayer, type Player } from "./Player";
import { discardCard, drawCard } from "./Deck";
import { addCardToHand, removeCardFromHand } from "./Hand";
import { consumeAction } from "./Turn";

import {
  type AttackCard,
  CardType,
  getAttackCardDamage,
  getPotionCardHealing,
  isAssociatedAttackForClass,
  isDirectlyPlayableCard,
} from "./Cards";

import { applyDamage, type DamageResult } from "./Damage";
import { applyHealing, type HealingResult } from "./Healing";
import { PlayerClass } from "./types";

import {
  applyClassPower,
  type ClassPowerEffect,
  type ClassPowerOptions,
} from "./ClassPowers";

// ============================================================
// TYPES
// ============================================================

export interface UseCardResult {
  cardId: string;
  cardType: CardType;
  targetId: string;

  damage?: DamageResult;
  healing?: HealingResult;

  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;
  drawnCardId?: string;

  /**
   * Effet du pouvoir de classe. Pour le Sorcier, il s'agit de l'effet
   * élémentaire choisi ponctuellement (identique à elementalPowerEffect).
   */
  classPowerEffect?: ClassPowerEffect;
  classPowerTriggered: boolean;

  /** Effet de la voie élémentaire permanente du joueur, si déclenchée. */
  elementalPowerEffect?: ElementalPowerEffect;
}

export type UseCardClassPowerOptions = ClassPowerOptions;

export interface UseCardElementalOptions {
  shieldBreakTargetId?: string;
}

export type UseCardOptions =
  UseCardClassPowerOptions & UseCardElementalOptions;

export interface PlaceHiddenCardResult {
  cardId: string;
  hiddenCardsCount: number;
}

export interface PlayElementalPathResult {
  cardId: string;
  element: Element;
  previousElement: Element | null;
}

// ============================================================
// BONUS RESOLUTION
// ============================================================
// Point unique de résolution des bonus applicables à une carte : pouvoir de
// classe (si l'attaque correspond à la classe du joueur), puis voie
// élémentaire permanente (si la carte est élémentaire et qu'une voie a été
// choisie). Partagé par les 4 branches de useCardForPlayer afin d'éviter la
// duplication entre versions classiques et élémentaires des cartes.

interface CardBonuses {
  classPowerEffect?: ClassPowerEffect;
  classPowerTriggered: boolean;
  elementalPowerEffect?: ElementalPowerEffect;
  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;
  drawnCardId?: string;
}

function mergeDamage(
  a: DamageResult | undefined,
  b: DamageResult | undefined,
): DamageResult | undefined {
  if (!a) return b;
  if (!b) return a;

  return {
    shieldDamage: a.shieldDamage + b.shieldDamage,
    hpDamage: a.hpDamage + b.hpDamage,
    dissipatedDamage: a.dissipatedDamage + b.dissipatedDamage,
    remainingShield: b.remainingShield,
    remainingHp: b.remainingHp,
    killed: a.killed || b.killed,
    elementalAdvantage: a.elementalAdvantage || b.elementalAdvantage,
    elementalBonusDamage: a.elementalBonusDamage + b.elementalBonusDamage,
  };
}

function mergeHealing(
  a: HealingResult | undefined,
  b: HealingResult | undefined,
): HealingResult | undefined {
  if (!a) return b;
  if (!b) return a;

  return {
    healed: a.healed + b.healed,
    dissipatedHealing: a.dissipatedHealing + b.dissipatedHealing,
    remainingHp: b.remainingHp,
    remainingShield: b.remainingShield,
  };
}

function mergeShieldBreak(
  a: ElementalShieldBreakResult | undefined,
  b: ElementalShieldBreakResult | undefined,
): ElementalShieldBreakResult | undefined {
  if (!a) return b;
  if (!b) return a;

  return {
    shieldBroken: a.shieldBroken + b.shieldBroken,
    remainingShield: b.remainingShield,
  };
}

function resolveCardBonuses(
  game: GameState,
  player: Player,
  target: Player,
  targetId: string,
  classPowerAttack: AttackCard | undefined,
  isElementalCard: boolean,
  options: UseCardOptions | undefined,
): CardBonuses {
  let classPowerEffect: ClassPowerEffect | undefined;
  let elementalPowerEffect: ElementalPowerEffect | undefined;
  let bonusDamage: DamageResult | undefined;
  let bonusHealing: HealingResult | undefined;
  let bonusShieldBreak: ElementalShieldBreakResult | undefined;
  let drawnCardId: string | undefined;

  const classPowerTriggered =
    classPowerAttack !== undefined &&
    isAssociatedAttackForClass(player.class, classPowerAttack);

  if (classPowerTriggered) {
    const result = applyClassPower(
      game,
      player,
      target,
      targetId,
      options,
    );

    classPowerEffect = result.classPowerEffect;
    elementalPowerEffect = result.elementalPowerEffect;
    bonusDamage = result.bonusDamage;
    bonusHealing = result.bonusHealing;
    bonusShieldBreak = result.bonusShieldBreak;
    drawnCardId = result.drawnCardId;
  }

  if (isElementalCard && player.element !== null) {
    const elementalResult = applyElementalPower(
      game,
      player,
      target,
      targetId,
      player.element,
      { shieldBreakTargetId: options?.shieldBreakTargetId },
    );

    // La voie élémentaire permanente est toujours distincte du pouvoir de
    // classe : les effets s'additionnent au lieu de s'écraser mutuellement.
    elementalPowerEffect = elementalResult.elementalPowerEffect;
    bonusDamage = mergeDamage(bonusDamage, elementalResult.bonusDamage);
    bonusHealing = mergeHealing(bonusHealing, elementalResult.bonusHealing);
    bonusShieldBreak = mergeShieldBreak(
      bonusShieldBreak,
      elementalResult.bonusShieldBreak,
    );
    drawnCardId = elementalResult.drawnCardId ?? drawnCardId;
  }

  return {
    classPowerEffect,
    classPowerTriggered,
    elementalPowerEffect,
    bonusDamage,
    bonusHealing,
    bonusShieldBreak,
    drawnCardId,
  };
}

// ============================================================
// DRAW CARD
// ============================================================

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

// ============================================================
// USE CARD
// ============================================================

export function useCardForPlayer(
  game: GameState,
  playerId: string,
  cardId: string,
  targetId?: string,
  options?: UseCardOptions,
): UseCardResult {
  const player = getPlayer(game.players, playerId);

  const cardInHand = player.hand.find(
    (card) => card.id === cardId,
  );

  if (!cardInHand) {
    throw new Error("Card is not in player's hand.");
  }

  if (!isDirectlyPlayableCard(cardInHand)) {
    throw new Error("This card type cannot be used yet.");
  }

  if (cardInHand.type === CardType.ElementalPath) {
    throw new Error(
      "Elemental path cards must be played with playElementalPathForPlayer.",
    );
  }

  const isAttackCard =
    cardInHand.type === CardType.Attack ||
    cardInHand.type === CardType.ElementalAttack;

  if (isAttackCard && !targetId) {
    throw new Error("Attack cards require a target.");
  }

  if (
    isAttackCard &&
    isAssociatedAttackForClass(player.class, cardInHand.attack) &&
    player.class === PlayerClass.Wizard &&
    options?.wizardElement === undefined
  ) {
    throw new Error("Wizard must choose an elemental passive.");
  }

  consumeAction(game, playerId);

  const removedCard = removeCardFromHand(player, cardId);

  if (cardInHand.type === CardType.Attack || cardInHand.type === CardType.ElementalAttack) {
    const resolvedTargetId = targetId as string;
    const target = getPlayer(game.players, resolvedTargetId);
    const isElementalCard = cardInHand.type === CardType.ElementalAttack;

    const damage = applyDamage(target, {
      sourceId: playerId,
      targetId: resolvedTargetId,
      amount: getAttackCardDamage(cardInHand.attack),
    });

    const bonuses = resolveCardBonuses(
      game,
      player,
      target,
      resolvedTargetId,
      cardInHand.attack,
      isElementalCard,
      options,
    );

    discardCard(game.deck, removedCard);

    return {
      cardId: removedCard.id,
      cardType: cardInHand.type,
      targetId: resolvedTargetId,
      damage,
      ...bonuses,
    };
  }

  // Potion ou potion élémentaire : jamais associées à un pouvoir de classe.
  const resolvedTargetId = targetId ?? playerId;
  const target = getPlayer(game.players, resolvedTargetId);
  const isElementalCard = cardInHand.type === CardType.ElementalPotion;

  const healing = applyHealing(target, {
    targetId: resolvedTargetId,
    amount: getPotionCardHealing(cardInHand.potion),
    type: cardInHand.potion === "health" ? "hp" : "shield",
  });

  const bonuses = resolveCardBonuses(
    game,
    player,
    target,
    resolvedTargetId,
    undefined,
    isElementalCard,
    options,
  );

  discardCard(game.deck, removedCard);

  return {
    cardId: removedCard.id,
    cardType: cardInHand.type,
    targetId: resolvedTargetId,
    healing,
    ...bonuses,
  };
}

// ============================================================
// HIDDEN CARDS
// ============================================================

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

  if (player.hiddenCards.length >= GAME_CONSTANTS.maxHiddenCards) {
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

// ============================================================
// ELEMENTAL PATH
// ============================================================

export function playElementalPathForPlayer(
  game: GameState,
  playerId: string,
  cardId: string,
  element: Element,
): PlayElementalPathResult {
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

  if (cardInHand.type !== CardType.ElementalPath) {
    throw new Error("This card is not an elemental path.");
  }

  consumeAction(game, playerId);

  const removedCard = removeCardFromHand(player, cardId);
  const previousElement = player.element;

  player.element = element;

  discardCard(game.deck, removedCard);

  return {
    cardId: removedCard.id,
    element,
    previousElement,
  };
}