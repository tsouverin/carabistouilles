import type { GameState } from "./GameState";
import { GAME_CONSTANTS } from "./constants";

import {
  Element,
  applyElementalPower,
  type ElementalPowerEffect,
  type ElementalShieldBreakResult,
} from "./Element";

import { getPlayer } from "./Player";

import {
  discardCard,
  drawCard,
} from "./Deck";

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


// ============================================================
// TYPES
// ============================================================

export interface UseCardResult {
  cardId: string;
  cardType: CardType;
  targetId: string;

  damage?: DamageResult;

  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;

  drawnCardId?: string;

  /**
   * Effet du pouvoir de classe.
   *
   * Pour le Sorcier, ce sera l'effet élémentaire
   * effectivement utilisé (ex: "fireBonusDamage"),
   * identique à elementalPowerEffect.
   */
  classPowerEffect?: ClassPowerEffect;

  /**
   * Effet élémentaire effectivement appliqué.
   *
   * Pour une attaque élémentaire classique :
   * il correspond à player.element.
   *
   * Pour le Sorcier :
   * il correspond à wizardElement lorsqu'il utilise
   * son pouvoir de classe.
   */
  elementalPowerEffect?: ElementalPowerEffect;

  classPowerTriggered?: boolean;

  healing?: HealingResult;
}

export type UseCardClassPowerOptions =
  ClassPowerOptions;

export interface UseCardElementalOptions {
  elementalElement?: Element;
  shieldBreakTargetId?: string;
}

export type UseCardOptions =
  UseCardClassPowerOptions &
  UseCardElementalOptions;


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
// DRAW CARD
// ============================================================

export function drawCardForPlayer(
  game: GameState,
  playerId: string,
  random: () => number = Math.random,
): void {
  const player = getPlayer(
    game.players,
    playerId,
  );

  consumeAction(
    game,
    playerId,
  );

  const card = drawCard(
    game.deck,
    random,
  );

  if (card === null) {
    return;
  }

  addCardToHand(
    player,
    card,
  );
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
  const player = getPlayer(
    game.players,
    playerId,
  );

  const cardInHand = player.hand.find(
    (card) => card.id === cardId,
  );

  if (!cardInHand) {
    throw new Error(
      "Card is not in player's hand.",
    );
  }

  if (!isDirectlyPlayableCard(cardInHand)) {
    throw new Error(
      "This card type cannot be used yet.",
    );
  }

  // ----------------------------------------------------------
  // ELEMENTAL PATH
  // ----------------------------------------------------------

  if (
    cardInHand.type ===
    CardType.ElementalPath
  ) {
    throw new Error(
      "Elemental path cards must be played with playElementalPathForPlayer.",
    );
  }

  // ----------------------------------------------------------
  // ATTACK TARGET
  // ----------------------------------------------------------

  const isAttack =
    cardInHand.type === CardType.Attack ||
    cardInHand.type === CardType.ElementalAttack;

  if (isAttack && !targetId) {
    throw new Error(
      "Attack cards require a target.",
    );
  }

  // ----------------------------------------------------------
  // WIZARD REQUIREMENT
  // ----------------------------------------------------------

  if (
    cardInHand.type === CardType.Attack &&
    isAssociatedAttackForClass(
      player.class,
      cardInHand.attack,
    ) &&
    options?.wizardElement === undefined &&
    player.class === "wizard"
  ) {
    throw new Error(
      "Wizard must choose an elemental passive.",
    );
  }

  // ----------------------------------------------------------
  // ACTION + REMOVE CARD
  // ----------------------------------------------------------

  consumeAction(
    game,
    playerId,
  );

  const removedCard =
    removeCardFromHand(
      player,
      cardId,
    );

  // ==========================================================
  // ATTACK CLASSIQUE
  // ==========================================================

  if (
    cardInHand.type ===
    CardType.Attack
  ) {
    const resolvedTargetId =
      targetId as string;

    const target = getPlayer(
      game.players,
      resolvedTargetId,
    );

    const damage =
      applyDamage(
        target,
        {
          sourceId: playerId,
          targetId: resolvedTargetId,
          amount:
            getAttackCardDamage(
              cardInHand.attack,
            ),
        },
      );

    let bonusDamage:
      | DamageResult
      | undefined;

    let bonusHealing:
      | HealingResult
      | undefined;

    let bonusShieldBreak:
      | ElementalShieldBreakResult
      | undefined;

    let drawnCardId:
      | string
      | undefined;

    let classPowerEffect:
      | ClassPowerEffect
      | undefined;

    const classPowerTriggered =
      isAssociatedAttackForClass(
        player.class,
        cardInHand.attack,
      );

    // --------------------------------------------------------
    // POUVOIR DE CLASSE
    // --------------------------------------------------------

    if (classPowerTriggered) {
      const result =
        applyClassPower(
          game,
          player,
          target,
          resolvedTargetId,
          options,
        );

      classPowerEffect =
        result.classPowerEffect;

      bonusDamage =
        result.bonusDamage;

      bonusHealing =
        result.bonusHealing;

      bonusShieldBreak =
        result.bonusShieldBreak;

      drawnCardId =
        result.drawnCardId;
    }

    discardCard(
      game.deck,
      removedCard,
    );

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


  // ==========================================================
  // ATTACK ÉLÉMENTAIRE
  // ==========================================================

  if (
    cardInHand.type ===
    CardType.ElementalAttack
  ) {
    const resolvedTargetId =
      targetId as string;

    const target = getPlayer(
      game.players,
      resolvedTargetId,
    );

    const damage =
      applyDamage(
        target,
        {
          sourceId: playerId,
          targetId: resolvedTargetId,
          amount:
            getAttackCardDamage(
              cardInHand.attack,
            ),
        },
      );

    let bonusDamage:
      | DamageResult
      | undefined;

    let bonusHealing:
      | HealingResult
      | undefined;

    let bonusShieldBreak:
      | ElementalShieldBreakResult
      | undefined;

    let drawnCardId:
      | string
      | undefined;

    let classPowerEffect:
      | ClassPowerEffect
      | undefined;

    let elementalPowerEffect:
      | ElementalPowerEffect
      | undefined;


    // --------------------------------------------------------
    // POUVOIR DE CLASSE
    // --------------------------------------------------------

    const classPowerTriggered =
      isAssociatedAttackForClass(
        player.class,
        cardInHand.attack,
      );

    if (classPowerTriggered) {
      const result =
        applyClassPower(
          game,
          player,
          target,
          resolvedTargetId,
          options,
        );

      classPowerEffect =
        result.classPowerEffect;

      bonusDamage =
        result.bonusDamage;

      bonusHealing =
        result.bonusHealing;

      bonusShieldBreak =
        result.bonusShieldBreak;

      drawnCardId =
        result.drawnCardId;

      /*
       * IMPORTANT :
       *
       * Le pouvoir de classe du Sorcier peut lui-même
       * utiliser un pouvoir élémentaire.
       *
       * Dans ce cas, applyClassPower() peut exposer
       * l'effet élémentaire dans son résultat.
       *
       * On le récupère séparément.
       */
      if (
        result.elementalPowerEffect !==
        undefined
      ) {
        elementalPowerEffect =
          result.elementalPowerEffect;
      }
    }


    // --------------------------------------------------------
    // POUVOIR DE LA VOIE ÉLÉMENTAIRE
    // --------------------------------------------------------

    if (
      player.element !== null
    ) {
      const elementalResult =
        applyElementalPower(
          game,
          player,
          target,
          resolvedTargetId,
          player.element,
          {
            shieldBreakTargetId:
              options?.shieldBreakTargetId,
          },
        );

      /*
       * Le pouvoir de la voie est toujours séparé
       * du pouvoir de classe.
       */
      elementalPowerEffect =
        elementalResult.elementalPowerEffect;

      if (
        elementalResult.bonusDamage
      ) {
        bonusDamage =
          elementalResult.bonusDamage;
      }

      if (
        elementalResult.bonusHealing
      ) {
        bonusHealing =
          elementalResult.bonusHealing;
      }

      if (
        elementalResult.bonusShieldBreak
      ) {
        bonusShieldBreak =
          elementalResult.bonusShieldBreak;
      }

      if (
        elementalResult.drawnCardId
      ) {
        drawnCardId =
          elementalResult.drawnCardId;
      }
    }

    discardCard(
      game.deck,
      removedCard,
    );

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
      elementalPowerEffect,

      classPowerTriggered,
    };
  }


  // ==========================================================
  // POTION
  // ==========================================================

  if (
    cardInHand.type ===
    CardType.Potion
  ) {
    const resolvedTargetId =
      targetId ?? playerId;

    const target = getPlayer(
      game.players,
      resolvedTargetId,
    );

    const healing =
      applyHealing(
        target,
        {
          targetId:
            resolvedTargetId,
          amount:
            getPotionCardHealing(
              cardInHand.potion,
            ),
          type:
            cardInHand.potion ===
            "health"
              ? "hp"
              : "shield",
        },
      );

    discardCard(
      game.deck,
      removedCard,
    );

    return {
      cardId: removedCard.id,
      cardType: cardInHand.type,
      targetId: resolvedTargetId,
      healing,
    };
  }


  // ==========================================================
  // POTION ÉLÉMENTAIRE
  // ==========================================================

  if (
    cardInHand.type ===
    CardType.ElementalPotion
  ) {
    const resolvedTargetId =
      targetId ?? playerId;

    const target = getPlayer(
      game.players,
      resolvedTargetId,
    );

    // --------------------------------------------------------
    // EFFET DE BASE
    // --------------------------------------------------------

    const healing =
      applyHealing(
        target,
        {
          targetId:
            resolvedTargetId,
          amount:
            getPotionCardHealing(
              cardInHand.potion,
            ),
          type:
            cardInHand.potion ===
            "health"
              ? "hp"
              : "shield",
        },
      );

    let bonusDamage:
      | DamageResult
      | undefined;

    let bonusHealing:
      | HealingResult
      | undefined;

    let bonusShieldBreak:
      | ElementalShieldBreakResult
      | undefined;

    let drawnCardId:
      | string
      | undefined;

    let elementalPowerEffect:
      | ElementalPowerEffect
      | undefined;

    // --------------------------------------------------------
    // POUVOIR ÉLÉMENTAIRE
    // --------------------------------------------------------

    if (
      player.element !== null
    ) {
      const elementalResult =
        applyElementalPower(
          game,
          player,
          target,
          resolvedTargetId,
          player.element,
          {
            shieldBreakTargetId:
              options?.shieldBreakTargetId,
          },
        );

      elementalPowerEffect =
        elementalResult.elementalPowerEffect;

      bonusDamage =
        elementalResult.bonusDamage;

      bonusHealing =
        elementalResult.bonusHealing;

      bonusShieldBreak =
        elementalResult.bonusShieldBreak;

      drawnCardId =
        elementalResult.drawnCardId;
    }

    discardCard(
      game.deck,
      removedCard,
    );

    return {
      cardId: removedCard.id,
      cardType: cardInHand.type,
      targetId: resolvedTargetId,

      healing,

      bonusDamage,
      bonusHealing,
      bonusShieldBreak,
      drawnCardId,

      elementalPowerEffect,
    };
  }


  // ==========================================================
  // UNKNOWN
  // ==========================================================

  throw new Error(
    "This card type cannot be used here.",
  );
}


// ============================================================
// HIDDEN CARDS
// ============================================================

export function placeHiddenCardForPlayer(
  game: GameState,
  playerId: string,
  cardId: string,
): PlaceHiddenCardResult {
  if (
    game.currentPlayerId !==
    playerId
  ) {
    throw new Error(
      "This player is not currently playing.",
    );
  }

  const player = getPlayer(
    game.players,
    playerId,
  );

  const cardInHand =
    player.hand.find(
      (card) => card.id === cardId,
    );

  if (!cardInHand) {
    throw new Error(
      "Card is not in player's hand.",
    );
  }

  if (
    player.hiddenCards.length >=
    GAME_CONSTANTS.maxHiddenCards
  ) {
    throw new Error(
      "Hidden card limit reached.",
    );
  }

  consumeAction(
    game,
    playerId,
  );

  const hiddenCard =
    removeCardFromHand(
      player,
      cardId,
    );

  player.hiddenCards.push(
    hiddenCard,
  );

  return {
    cardId: hiddenCard.id,
    hiddenCardsCount:
      player.hiddenCards.length,
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
  if (
    game.currentPlayerId !==
    playerId
  ) {
    throw new Error(
      "This player is not currently playing.",
    );
  }

  const player = getPlayer(
    game.players,
    playerId,
  );

  const cardInHand =
    player.hand.find(
      (card) => card.id === cardId,
    );

  if (!cardInHand) {
    throw new Error(
      "Card is not in player's hand.",
    );
  }

  if (
    cardInHand.type !==
    CardType.ElementalPath
  ) {
    throw new Error(
      "This card is not an elemental path.",
    );
  }

  consumeAction(
    game,
    playerId,
  );

  const removedCard =
    removeCardFromHand(
      player,
      cardId,
    );

  const previousElement =
    player.element;

  player.element =
    element;

  discardCard(
    game.deck,
    removedCard,
  );

  return {
    cardId: removedCard.id,
    element,
    previousElement,
  };
}