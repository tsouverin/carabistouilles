import type { Player } from "./Player";
import { PlayerStatus } from "./types";

export interface DamageEffect {
  sourceId: string;
  targetId: string;
  amount: number;
  ignoresShield?: boolean;
}

export interface DamageResult {
  shieldDamage: number;
  hpDamage: number;
  remainingShield: number;
  remainingHp: number;
  dissipatedDamage: number;
  killed: boolean;
}

export function applyDamage(
  target: Player,
  effect: DamageEffect,
): DamageResult {
  if (!Number.isInteger(effect.amount) || effect.amount <= 0) {
    throw new Error("Damage amount must be a positive integer.");
  }

  let shieldDamage = 0;
  let hpDamage = 0;

  if (effect.ignoresShield) {
    hpDamage = Math.min(target.hp, effect.amount);
    target.hp -= hpDamage;
  } else if (target.shield > 0) {
    shieldDamage = Math.min(target.shield, effect.amount);
    target.shield -= shieldDamage;
  } else {
    hpDamage = Math.min(target.hp, effect.amount);
    target.hp -= hpDamage;
  }

  const dissipatedDamage = effect.amount - shieldDamage - hpDamage;

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
  };
}