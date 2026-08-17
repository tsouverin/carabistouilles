import type { Player } from "./Player";

export type HealingType = "hp" | "shield";

export interface HealingEffect {
  targetId: string;
  amount: number;
  type: HealingType;
}
export interface HealingResult {
  healed: number;
  dissipatedHealing: number;
  remainingHp: number;
  remainingShield: number;
}
export function applyHealing(
  target: Player,
  effect: HealingEffect,
): HealingResult {
  if (!Number.isInteger(effect.amount) || effect.amount <= 0) {
    throw new Error("Healing amount must be a positive integer.");
  }

  const healed =
    effect.type === "hp"
      ? Math.min(effect.amount, 10 - target.hp)
      : Math.min(effect.amount, 10 - target.shield);

  if (effect.type === "hp") {
    target.hp += healed;
  } else {
    target.shield += healed;
  }

  return {
    healed,
    dissipatedHealing: effect.amount - healed,
    remainingHp: target.hp,
    remainingShield: target.shield,
  };
}