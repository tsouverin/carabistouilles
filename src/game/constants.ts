export const GAME_CONSTANTS = {
  maxHp: 10,
  maxShield: 10,
  startingHp: 10,
  startingShield: 5,
  maxHiddenCards: 2,
} as const;

export const INITIAL_DECK_CONFIG = {
  attacks: {
    arrow: 20,
    club: 20,
    sword: 20,
    scroll: 20,
  },
  potions: {
    health: 30,
    shield: 15,
  },
  elementalAttack: {
      arrow: 10,
      club: 10,
      sword: 10,
      scroll: 10,
  },
  elementalPotion: {
      health: 10,
      shield: 5,
  },
  elementalPath: 15,
  trick: 0
} as const;

export function expectedDeckSize(): number {
  return (
    Object.values(INITIAL_DECK_CONFIG.attacks)
      .reduce((sum, count) => sum + count, 0)
    + Object.values(INITIAL_DECK_CONFIG.potions)
      .reduce((sum, count) => sum + count, 0)
    + Object.values(INITIAL_DECK_CONFIG.elementalAttack)
      .reduce((sum, count) => sum + count, 0)
    + Object.values(INITIAL_DECK_CONFIG.elementalPotion)
      .reduce((sum, count) => sum + count, 0)
    + INITIAL_DECK_CONFIG.elementalPath
    + INITIAL_DECK_CONFIG.trick
  );
}