import type { GameState } from "./GameState";
import { getPlayer, type Player } from "./Player";
import { drawCard } from "./Deck";
import { addCardToHand } from "./Hand";
import {
  applyDamage,
  type DamageResult,
} from "./Damage";
import {
  applyHealing,
  type HealingResult,
} from "./Healing";

export const Element = {
  Fire: "fire",
  Water: "water",
  Earth: "earth",
  Air: "air",
} as const;

export type Element =
  (typeof Element)[keyof typeof Element];

export function hasElementAdvantage(
  attacker: Element,
  defender: Element,
): boolean {
  return (
    (attacker === Element.Air &&
      defender === Element.Earth) ||
    (attacker === Element.Earth &&
      defender === Element.Water) ||
    (attacker === Element.Water &&
      defender === Element.Fire) ||
    (attacker === Element.Fire &&
      defender === Element.Air)
  );
}

// ============================================================
// ELEMENTAL PASSIVE BONUSES
// ============================================================

export const ELEMENTAL_FIRE_BONUS_DAMAGE = 1;
export const ELEMENTAL_WATER_SHIELD_HEAL = 1;
export const ELEMENTAL_EARTH_SHIELD_BREAK = 1;

// ============================================================
// SHIELD BREAK
// ============================================================

export interface ElementalShieldBreakTarget {
  shield: number;
}

export interface ElementalShieldBreakResult {
  shieldBroken: number;
  remainingShield: number;
}

export function applyElementalShieldBreak<
  T extends ElementalShieldBreakTarget,
>(
  target: T,
  amount: number = ELEMENTAL_EARTH_SHIELD_BREAK,
): ElementalShieldBreakResult {
  const shieldBroken = Math.min(
    target.shield,
    amount,
  );

  target.shield -= shieldBroken;

  return {
    shieldBroken,
    remainingShield: target.shield,
  };
}

// ============================================================
// ELEMENTAL POWER
// ============================================================

export type ElementalPowerEffect =
  | "fireBonusDamage"
  | "waterShieldHeal"
  | "earthShieldBreak"
  | "airCardDraw";

export interface ElementalPowerResult {
  classPowerEffect: ElementalPowerEffect;
  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;
  drawnCardId?: string;
}

export interface ElementalPowerOptions {
  shieldBreakTargetId?: string;
}

/**
 * Applies the passive effect associated with the player's
 * elemental path.
 *
 * This function should only be called when the player
 * already has an elemental path.
 *
 * If the player has no elemental path, the card's base
 * effect must be handled by the caller without calling
 * this function.
 */
export function applyElementalPower(
  game: GameState,
  player: Player,
  target: Player,
  targetId: string,
  element: Element,
  options?: ElementalPowerOptions,
): ElementalPowerResult {
  // ==========================================================
  // FIRE
  // ==========================================================

  if (element === Element.Fire) {
    return {
      classPowerEffect: "fireBonusDamage",
      bonusDamage: applyDamage(target, {
        sourceId: player.id,
        targetId,
        amount: ELEMENTAL_FIRE_BONUS_DAMAGE,
      }),
    };
  }

  // ==========================================================
  // WATER
  // ==========================================================

  if (element === Element.Water) {
    return {
      classPowerEffect: "waterShieldHeal",
      bonusHealing: applyHealing(player, {
        targetId: player.id,
        amount: ELEMENTAL_WATER_SHIELD_HEAL,
        type: "shield",
      }),
    };
  }

  // ==========================================================
  // EARTH
  // ==========================================================

  if (element === Element.Earth) {
    const shieldBreakTargetId =
      options?.shieldBreakTargetId ?? player.id;

    const shieldBreakTarget = getPlayer(
      game.players,
      shieldBreakTargetId,
    );

    return {
      classPowerEffect: "earthShieldBreak",
      bonusShieldBreak: applyElementalShieldBreak(
        shieldBreakTarget,
      ),
    };
  }

  // ==========================================================
  // AIR
  // ==========================================================

  const drawnCard = drawCard(game.deck);

  if (drawnCard === null) {
    return {
      classPowerEffect: "airCardDraw",
    };
  }

  addCardToHand(player, drawnCard);

  return {
    classPowerEffect: "airCardDraw",
    drawnCardId: drawnCard.id,
  };
}