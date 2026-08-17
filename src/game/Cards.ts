import {
  PlayerClass,
  type PlayerClass as PlayerClassType,
} from "./types";

export const CardType = {
  Attack: "attack",
  Potion: "potion",
  ElementalAttack: "elementalAttack",
  ElementalPotion: "elementalPotion",
  ElementalPath: "elementalPath",
  Trick: "trick",
} as const;

export type CardType =
  (typeof CardType)[keyof typeof CardType];

export const AttackCard = {
  Arrow: "arrow",
  Club: "club",
  Sword: "sword",
  Scroll: "scroll",
} as const;

export type AttackCard =
  (typeof AttackCard)[keyof typeof AttackCard];

export const PotionCard = {
  Health: "health",
  Shield: "shield",
} as const;

export type PotionCard =
  (typeof PotionCard)[keyof typeof PotionCard];

export interface BaseCard {
  id: string;
  name: string;
}

export interface AttackCardInstance extends BaseCard {
  type: typeof CardType.Attack;
  attack: AttackCard;
}

export interface PotionCardInstance extends BaseCard {
  type: typeof CardType.Potion;
  potion: PotionCard;
}

export interface ElementalAttackCardInstance extends BaseCard {
  type: typeof CardType.ElementalAttack;
  attack: AttackCard;
}

export interface ElementalPotionCardInstance extends BaseCard {
  type: typeof CardType.ElementalPotion;
  potion: PotionCard;
}

export interface ElementalPathCardInstance extends BaseCard {
  type: typeof CardType.ElementalPath;
}

export interface TrickCardInstance extends BaseCard {
  type: typeof CardType.Trick;
}

export type DirectlyPlayableCard =
  | AttackCardInstance
  | PotionCardInstance
  | ElementalAttackCardInstance
  | ElementalPotionCardInstance
  | ElementalPathCardInstance;


// Minimal card contract for the first playable slice.
export const ATTACK_CARD_DAMAGE: Record<AttackCard, number> = {
  [AttackCard.Arrow]: 1,
  [AttackCard.Club]: 1,
  [AttackCard.Sword]: 1,
  [AttackCard.Scroll]: 1,
};

export const CLASS_ASSOCIATED_ATTACK: Record<
  PlayerClassType,
  AttackCard
> = {
  [PlayerClass.Warrior]: AttackCard.Club,
  [PlayerClass.Paladin]: AttackCard.Sword,
  [PlayerClass.Archer]: AttackCard.Arrow,
  [PlayerClass.Wizard]: AttackCard.Scroll,
};

export const POTION_CARD_HEALING: Record<PotionCard, number> = {
  [PotionCard.Health]: 1,
  [PotionCard.Shield]: 1,
};

export function isDirectlyPlayableCard(
  card: Card,
): card is DirectlyPlayableCard {
  return (
    card.type === CardType.Attack ||
    card.type === CardType.Potion ||
    card.type === CardType.ElementalAttack ||
    card.type === CardType.ElementalPotion ||
    card.type === CardType.ElementalPath 
  );
}

export function getAttackCardDamage(
  attack: AttackCard,
): number {
  return ATTACK_CARD_DAMAGE[attack];
}

export function isAssociatedAttackForClass(
  playerClass: PlayerClassType,
  attack: AttackCard,
): boolean {
  return CLASS_ASSOCIATED_ATTACK[playerClass] === attack;
}

export function getPotionCardHealing(
  potion: PotionCard,
): number {
  return POTION_CARD_HEALING[potion];
}

export type Card =
  | AttackCardInstance
  | PotionCardInstance
  | ElementalAttackCardInstance
  | ElementalPotionCardInstance
  | ElementalPathCardInstance
  | TrickCardInstance;