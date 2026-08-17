import type { GameState } from "./GameState";
import { getPlayer, type Player } from "./Player";
import { applyDamage, type DamageResult } from "./Damage";
import { applyHealing, type HealingResult } from "./Healing";
import { PlayerClass } from "./types";
import {
  Element,
  applyElementalScrollPower,
  type ElementalPowerEffect,
  type ElementalShieldBreakResult,
} from "./Element";

export type ArcherMode = "shieldBreak" | "piercing";

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
}

export interface ClassPowerOptions {
  classPowerTargetId?: string;
  archerMode?: ArcherMode;
  wizardElement?: Element;
}

// Single entry point so every class is triggered the same way, whatever its power resolves to.
export function applyClassPower(
  game: GameState,
  player: Player,
  target: Player,
  resolvedTargetId: string,
  options?: ClassPowerOptions,
): ClassPowerResult {
  if (player.class === PlayerClass.Warrior) {
    return applyWarriorPower(target, player.id, resolvedTargetId);
  }

  if (player.class === PlayerClass.Paladin) {
    const shieldTargetId = options?.classPowerTargetId ?? player.id;

    return applyPaladinPower(game, shieldTargetId);
  }

  if (player.class === PlayerClass.Archer) {
    const archerMode = options?.archerMode ?? "piercing";

    return applyArcherPower(
      target,
      player.id,
      resolvedTargetId,
      archerMode,
    );
  }

  const scrollElement = options?.wizardElement as Element;

  return applyElementalScrollPower(
    game,
    player,
    target,
    resolvedTargetId,
    scrollElement,
    { shieldBreakTargetId: options?.classPowerTargetId },
  );
}

export function applyWarriorPower(
  target: Player,
  sourceId: string,
  targetId: string,
): ClassPowerResult {
  return {
    classPowerEffect: "warriorBonusDamage",
    bonusDamage: applyDamage(target, {
      sourceId,
      targetId,
      amount: 1,
    }),
  };
}

export function applyPaladinPower(
  game: GameState,
  shieldTargetId: string,
): ClassPowerResult {
  const shieldTarget = getPlayer(game.players, shieldTargetId);

  return {
    classPowerEffect: "paladinShieldBlessing",
    bonusHealing: applyHealing(shieldTarget, {
      targetId: shieldTargetId,
      amount: 1,
      type: "shield",
    }),
  };
}

export function applyArcherPower(
  target: Player,
  sourceId: string,
  targetId: string,
  mode: ArcherMode,
): ClassPowerResult {
  if (mode === "shieldBreak") {
    const shieldDamage = Math.min(target.shield, 2);

    target.shield -= shieldDamage;

    return {
      classPowerEffect: "archerShieldBreakDamage",
      bonusDamage: {
        shieldDamage,
        hpDamage: 0,
        remainingShield: target.shield,
        remainingHp: target.hp,
        dissipatedDamage: 2 - shieldDamage,
        killed: false,
      },
    };
  }

  return {
    classPowerEffect: "archerPiercingDamage",
    bonusDamage: applyDamage(target, {
      sourceId,
      targetId,
      amount: 1,
      ignoresShield: true,
    }),
  };
}
