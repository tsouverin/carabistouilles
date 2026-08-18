
import type { GameState } from "./GameState";
import type { Player } from "./Player";
import { applyDamage, type DamageResult } from "./Damage";
import { applyHealing, type HealingResult } from "./Healing";
import { addCardToHand } from "./Hand";
import { drawCard } from "./Deck";

export const Element = {
  Fire: "fire",
  Water: "water",
  Earth: "earth",
  Air: "air",
} as const;

export type Element =
  (typeof Element)[keyof typeof Element];

export type ElementalPowerEffect =
  | "fireBonusDamage"
  | "waterShieldHeal"
  | "earthShieldBreak"
  | "airCardDraw";

export interface ElementalPowerResult {
  elementalPowerEffect: ElementalPowerEffect;
  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;
  drawnCardId?: string;
}

export interface ElementalPowerOptions {
  shieldBreakTargetId?: string;
}

export interface ElementalShieldBreakResult {
  shieldBroken: number;
  remainingShield: number;
}

/**
 * Détermine si l'élément attaquant possède l'avantage
 * sur l'élément de la cible.
 *
 * Cycle :
 * Air > Terre > Eau > Feu > Air
 */
export function hasElementAdvantage(
  attackingElement: Element,
  defendingElement: Element,
): boolean {
  return (
    (attackingElement === Element.Air &&
      defendingElement === Element.Earth) ||
    (attackingElement === Element.Earth &&
      defendingElement === Element.Water) ||
    (attackingElement === Element.Water &&
      defendingElement === Element.Fire) ||
    (attackingElement === Element.Fire &&
      defendingElement === Element.Air)
  );
}

/**
 * Retire des points de bouclier à une cible, sans jamais passer sous 0.
 * `amount` par défaut à 1, correspondant au bonus passif de la Terre.
 */
export function applyElementalShieldBreak(
  target: Pick<Player, "shield">,
  amount: number = 1,
): ElementalShieldBreakResult {
  const shieldBroken = Math.min(target.shield, amount);

  target.shield -= shieldBroken;

  return {
    shieldBroken,
    remainingShield: target.shield,
  };
}

/**
 * Applique un bonus élémentaire.
 *
 * IMPORTANT :
 * `element` est l'élément DU BONUS À UTILISER.
 *
 * Il ne doit donc pas nécessairement correspondre à
 * `player.element`.
 *
 * Cela permet notamment au Sorcier d'utiliser, via son
 * pouvoir de classe, le bonus élémentaire de son choix
 * sans modifier sa voie élémentaire permanente.
 */
export function applyElementalPower(
  game: GameState,
  player: Player,
  target: Player,
  targetId: string,
  element: Element,
  options?: ElementalPowerOptions,
): ElementalPowerResult {
  switch (element) {
    // ==========================================================
    // FEU
    // ==========================================================

    case Element.Fire:
      return {
        elementalPowerEffect: "fireBonusDamage",
        bonusDamage: applyDamage(target, {
          sourceId: player.id,
          targetId,
          amount: 1,
        }),
      };

    // ==========================================================
    // EAU
    // ==========================================================

    case Element.Water:
      return {
        elementalPowerEffect: "waterShieldHeal",
        bonusHealing: applyHealing(player, {
          targetId: player.id,
          amount: 1,
          type: "shield",
        }),
      };

    // ==========================================================
    // TERRE
    // ==========================================================

    case Element.Earth: {
      const shieldTargetId =
        options?.shieldBreakTargetId ?? targetId;

      const shieldTarget = game.players.find(
        (candidate) => candidate.id === shieldTargetId,
      );

      if (!shieldTarget) {
        throw new Error(
          `Player with id "${shieldTargetId}" not found.`,
        );
      }

      return {
        elementalPowerEffect: "earthShieldBreak",
        bonusShieldBreak:
          applyElementalShieldBreak(shieldTarget),
      };
    }

    // ==========================================================
    // AIR
    // ==========================================================

    case Element.Air: {
      const card = drawCard(game.deck);

      if (card === null) {
        return {
          elementalPowerEffect: "airCardDraw",
        };
      }

      addCardToHand(player, card);

      return {
        elementalPowerEffect: "airCardDraw",
        drawnCardId: card.id,
      };
    }
  }
}
