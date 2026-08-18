import type { GameState } from "./GameState";
import { getPlayer, type Player } from "./Player";
import { applyDamage, type DamageResult } from "./Damage";
import { applyHealing, type HealingResult } from "./Healing";
import { PlayerClass } from "./types";
import {
  Element,
  applyElementalPower,
  type ElementalPowerEffect,
  type ElementalShieldBreakResult,
} from "./Element";

export type ArcherMode =
  | "shieldBreak"
  | "piercing";

export type ClassPowerEffect =
  | "warriorBonusDamage"
  | "paladinShieldBlessing"
  | "archerShieldBreakDamage"
  | "archerPiercingDamage"
  | ElementalPowerEffect;

export interface ClassPowerResult {
  classPowerEffect: ClassPowerEffect;
  bonusDamage?: DamageResult;
  bonusHealing?: HealingResult;
  bonusShieldBreak?: ElementalShieldBreakResult;
  drawnCardId?: string;

  /**
   * Effet élémentaire utilisé par le pouvoir
   * de classe du Sorcier.
   */
  elementalPowerEffect?: ElementalPowerEffect;
}

export interface ClassPowerOptions {
  classPowerTargetId?: string;
  archerMode?: ArcherMode;
  wizardElement?: Element;
}

/**
 * Point d'entrée unique pour les pouvoirs de classe.
 *
 * Le pouvoir du Sorcier est particulier :
 * il lui permet de choisir ponctuellement un élément
 * afin d'utiliser le bonus passif correspondant.
 *
 * Ce choix ne modifie jamais player.element.
 */
export function applyClassPower(
  game: GameState,
  player: Player,
  target: Player,
  resolvedTargetId: string,
  options?: ClassPowerOptions,
): ClassPowerResult {
  switch (player.class) {
    case PlayerClass.Warrior:
      return applyWarriorPower(
        target,
        player.id,
        resolvedTargetId,
      );

    case PlayerClass.Paladin: {
      const shieldTargetId =
        options?.classPowerTargetId ??
        player.id;

      return applyPaladinPower(
        game,
        shieldTargetId,
      );
    }

    case PlayerClass.Archer: {
      const archerMode =
        options?.archerMode ?? "piercing";

      return applyArcherPower(
        target,
        player.id,
        resolvedTargetId,
        archerMode,
      );
    }

    case PlayerClass.Wizard: {
      const shieldBreakTargetId =
        options?.classPowerTargetId ??
        player.id;

      return applyWizardPower(
        game,
        player,
        target,
        resolvedTargetId,
        options?.wizardElement,
        shieldBreakTargetId,
      );
    }
  }
}

/**
 * Pouvoir du Guerrier :
 * inflige 1 dégât supplémentaire.
 */
export function applyWarriorPower(
  target: Player,
  sourceId: string,
  targetId: string,
): ClassPowerResult {
  return {
    classPowerEffect:
      "warriorBonusDamage",

    bonusDamage: applyDamage(target, {
      sourceId,
      targetId,
      amount: 1,
    }),
  };
}

/**
 * Pouvoir du Paladin :
 * restaure 1 point de bouclier à la cible choisie.
 *
 * Par défaut, le Paladin se cible lui-même.
 */
export function applyPaladinPower(
  game: GameState,
  shieldTargetId: string,
): ClassPowerResult {
  const shieldTarget = getPlayer(
    game.players,
    shieldTargetId,
  );

  return {
    classPowerEffect:
      "paladinShieldBlessing",

    bonusHealing: applyHealing(
      shieldTarget,
      {
        targetId: shieldTargetId,
        amount: 1,
        type: "shield",
      },
    ),
  };
}

/**
 * Pouvoir de l'Archer :
 *
 * - shieldBreak : casse jusqu'à 2 PB
 * - piercing : inflige 1 dégât en ignorant le bouclier
 */
export function applyArcherPower(
  target: Player,
  sourceId: string,
  targetId: string,
  mode: ArcherMode,
): ClassPowerResult {
  if (mode === "shieldBreak") {
    const shieldDamage = Math.min(
      target.shield,
      2,
    );

    target.shield -= shieldDamage;

    return {
      classPowerEffect:
        "archerShieldBreakDamage",

      bonusDamage: {
        shieldDamage,
        hpDamage: 0,
        remainingShield:
          target.shield,
        remainingHp:
          target.hp,
        dissipatedDamage:
          2 - shieldDamage,
        killed: false,
      },
    };
  }

  return {
    classPowerEffect:
      "archerPiercingDamage",

    bonusDamage: applyDamage(target, {
      sourceId,
      targetId,
      amount: 1,
      ignoresShield: true,
    }),
  };
}

/**
 * Pouvoir du Sorcier.
 *
 * Le Sorcier choisit ponctuellement un élément et
 * utilise le bonus passif associé.
 *
 * Le bonus est calculé par applyElementalPower(),
 * exactement comme pour une voie élémentaire normale.
 *
 * IMPORTANT :
 * wizardElement est indépendant de player.element.
 *
 * Exemple :
 *
 *   player.element = Element.Water
 *   wizardElement = Element.Fire
 *
 * Le Sorcier utilise le bonus Feu pour cette action,
 * mais sa voie permanente reste Eau.
 */
export function applyWizardPower(
  game: GameState,
  player: Player,
  target: Player,
  targetId: string,
  wizardElement?: Element,
  shieldBreakTargetId?: string,
): ClassPowerResult {
  /*
   * Le Sorcier peut choisir ponctuellement un élément
   * (wizardElement). S'il ne le fait pas mais qu'il a
   * déjà une voie élémentaire permanente (player.element),
   * son pouvoir de classe utilise cette voie par défaut.
   */
  const resolvedElement =
    wizardElement ?? player.element ?? undefined;

  if (resolvedElement === undefined) {
    throw new Error(
      "Wizard must choose an elemental passive.",
    );
  }

  const elementalResult =
    applyElementalPower(
      game,
      player,
      target,
      targetId,
      resolvedElement,
      {
        shieldBreakTargetId,
      },
    );

  return {
    /*
     * Pour le Sorcier, le pouvoir de classe EST
     * le bonus élémentaire utilisé : classPowerEffect
     * et elementalPowerEffect portent donc la même
     * valeur (ex: "fireBonusDamage").
     */
    classPowerEffect:
      elementalResult.elementalPowerEffect,

    bonusDamage:
      elementalResult.bonusDamage,

    bonusHealing:
      elementalResult.bonusHealing,

    bonusShieldBreak:
      elementalResult.bonusShieldBreak,

    drawnCardId:
      elementalResult.drawnCardId,

    elementalPowerEffect:
      elementalResult.elementalPowerEffect,
  };
}