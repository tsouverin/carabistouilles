import type { Player } from "./Player";
import { PlayerStatus } from "./types";
import {hasElementAdvantage, type Element,} from "./Element";

export interface DamageEffect {
  sourceId: string;
  targetId: string;
  amount: number;
  ignoresShield?: boolean;
  elementalAttack?: Element;
}

export interface DamageResult {
  shieldDamage: number;
  hpDamage: number;
  remainingShield: number;
  remainingHp: number;
  dissipatedDamage: number;
  killed: boolean;
  elementalAdvantage: boolean;
  elementalBonusDamage: number;
}

export function applyDamage(
  target: Player,
  effect: DamageEffect,
): DamageResult {
  if (
    !Number.isInteger(effect.amount) ||
    effect.amount <= 0
  ) {
    throw new Error(
      "Damage amount must be a positive integer.",
    );
  }

  const elementalAdvantage =
    effect.elementalAttack !== undefined &&
    target.element !== undefined &&
    hasElementAdvantage(
      effect.elementalAttack,
      target.element,
    );

  const elementalBonusDamage =
    elementalAdvantage ? 1 : 0;

  const finalDamage =
    effect.amount + elementalBonusDamage;

  let shieldDamage = 0;
  let hpDamage = 0;

  if (effect.ignoresShield) {
    hpDamage = Math.min(
      target.hp,
      finalDamage,
    );

    target.hp -= hpDamage;
  } else if (target.shield > 0) {
    shieldDamage = Math.min(
      target.shield,
      finalDamage,
    );

    target.shield -= shieldDamage;
  } else {
    hpDamage = Math.min(
      target.hp,
      finalDamage,
    );

    target.hp -= hpDamage;
  }

  const dissipatedDamage =
    finalDamage -
    shieldDamage -
    hpDamage;

  const killed = target.hp === 0;

  if (killed) {
    target.status = PlayerStatus.Dead;
  }

  return {
    shieldDamage,
    hpDamage,
    remainingShield: target.shield,
    remainingHp: target.hp,
    dissipatedDamage,
    killed,
    elementalAdvantage,
    elementalBonusDamage,
  };
}