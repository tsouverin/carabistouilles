import type { GameState } from "./GameState";
import { getPlayer, type Player } from "./Player";
import { drawCard } from "./Deck";
import { addCardToHand } from "./Hand";
import { applyDamage, type DamageResult } from "./Damage";
import { applyHealing, type HealingResult } from "./Healing";

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
    (attacker === Element.Air && defender === Element.Earth) ||
    (attacker === Element.Earth && defender === Element.Water) ||
    (attacker === Element.Water && defender === Element.Fire) ||
    (attacker === Element.Fire && defender === Element.Air)
  );
}

// Passive bonuses granted by an elemental path, shared by any class that can trigger them.
export const ELEMENTAL_FIRE_BONUS_DAMAGE = 1;
export const ELEMENTAL_WATER_SHIELD_HEAL = 1;
export const ELEMENTAL_EARTH_SHIELD_BREAK = 1;

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
  const shieldBroken = Math.min(target.shield, amount);
  target.shield -= shieldBroken;

  return {
    shieldBroken,
    remainingShield: target.shield,
  };
}

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

// Grants only the passive bonus of the chosen element, no elemental combat advantage.
export function applyElementalPower(
  game: GameState,
  player: Player,
  target: Player,
  resolvedTargetId: string,
  element: Element,
  options?: ElementalPowerOptions,
): ElementalPowerResult {
  if (element === Element.Fire) {
    return {
      classPowerEffect: "fireBonusDamage",
      bonusDamage: applyDamage(target, {
        sourceId: player.id,
        targetId: resolvedTargetId,
        amount: ELEMENTAL_FIRE_BONUS_DAMAGE,
      }),
    };
  }

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

  if (element === Element.Earth) {
    const shieldBreakTargetId =
      options?.shieldBreakTargetId ?? player.id;
    const shieldBreakTarget = getPlayer(
      game.players,
      shieldBreakTargetId,
    );

    return {
      classPowerEffect: "earthShieldBreak",
      bonusShieldBreak: applyElementalShieldBreak(shieldBreakTarget),
    };
  }

  const drawnCard = drawCard(game.deck);

  if (drawnCard) {
    addCardToHand(player, drawnCard);

    return {
      classPowerEffect: "airCardDraw",
      drawnCardId: drawnCard.id,
    };
  }

  return { classPowerEffect: "airCardDraw" };
}