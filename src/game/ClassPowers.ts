import type { GameState } from "./GameState";
import { getPlayer, type Player } from "./Player";
import {
  applyDamage,
  type DamageResult,
} from "./Damage";
import {
  applyHealing,
  type HealingResult,
} from "./Healing";
import { PlayerClass } from "./types";
import {
  Element,
  applyElementalPower,
  applyElementalShieldBreak,
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
  | ElementalPowerEffect
  | "wizardNoElementalPassive";

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

  /**
   * Choix ponctuel du Sorcier :
   *
   * - Element.X : utilise le bonus élémentaire choisi
   * - null : n'utilise aucun bonus élémentaire
   * - undefined : aucun choix n'a été fourni
   *
   * Ce choix est indépendant de player.element.
   */
  wizardElement?: Element | null;
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
    const { shieldBroken, remainingShield } =
      applyElementalShieldBreak(target, 2);

    return {
      classPowerEffect:
        "archerShieldBreakDamage",

      bonusDamage: {
        shieldDamage: shieldBroken,
        hpDamage: 0,
        remainingShield,
        remainingHp:
          target.hp,
        dissipatedDamage:
          2 - shieldBroken,
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
 *
 * wizardElement est totalement indépendant
 * de player.element.
 *
 * Il n'y a aucun fallback vers la voie élémentaire
 * permanente du Sorcier.
 *
 * Les trois états sont donc volontairement distincts :
 *
 *   undefined -> aucun choix fourni : erreur
 *   null      -> choix volontaire : aucun bonus
 *   Element.X -> utilise le bonus de l'élément X
 */
export function applyWizardPower(
  game: GameState,
  player: Player,
  target: Player,
  targetId: string,
  wizardElement?: Element | null,
  shieldBreakTargetId?: string,
): ClassPowerResult {
  if (wizardElement === undefined) {
    throw new Error(
      "Wizard must choose whether to use an elemental passive.",
    );
  }

  if (wizardElement === null) {
    return {
      classPowerEffect:
        "wizardNoElementalPassive",
    };
  }

  const elementalResult =
    applyElementalPower(
      game,
      player,
      target,
      targetId,
      wizardElement,
      {
        shieldBreakTargetId,
      },
    );

  return {
    /*
     * Le pouvoir de classe du Sorcier utilise
     * directement l'effet élémentaire choisi.
     *
     * Exemple :
     *
     *   wizardElement = Element.Fire
     *
     * donnera :
     *
     *   classPowerEffect = "fireBonusDamage"
     *   elementalPowerEffect = "fireBonusDamage"
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