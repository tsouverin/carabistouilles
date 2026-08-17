import { describe, expect, it } from "vitest";
import {
  CLASS_DICE,
  rollDice,
  rollClassDice,
} from "../Dice";
import { PlayerClass } from "../types";

describe("CLASS_DICE", () => {
  it("possède un dé pour chaque classe", () => {
    expect(CLASS_DICE[PlayerClass.Warrior]).toBeDefined();
    expect(CLASS_DICE[PlayerClass.Paladin]).toBeDefined();
    expect(CLASS_DICE[PlayerClass.Archer]).toBeDefined();
    expect(CLASS_DICE[PlayerClass.Wizard]).toBeDefined();
  });

  it("définit les faces du Dé de Guerre", () => {
    expect(
      CLASS_DICE[PlayerClass.Warrior].faces,
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("définit les faces du Dé mystique", () => {
    expect(
      CLASS_DICE[PlayerClass.Wizard].faces,
    ).toEqual([1, 2, 2, 3, 3, 4]);
  });

  it("définit les faces du Dé de Précision", () => {
    expect(
      CLASS_DICE[PlayerClass.Archer].faces,
    ).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it("définit les faces du Dé du Destin", () => {
    expect(
      CLASS_DICE[PlayerClass.Paladin].faces,
    ).toEqual([1, 1, 2, 2, 7, 7]);
  });
});

describe("rollDice", () => {
  it("peut tirer la première face", () => {
    const dice = CLASS_DICE[PlayerClass.Warrior];

    const result = rollDice(dice, () => 0);

    expect(result).toBe(1);
  });

  it("peut tirer la dernière face", () => {
    const dice = CLASS_DICE[PlayerClass.Warrior];

    const result = rollDice(dice, () => 0.999999);

    expect(result).toBe(6);
  });
  it("respecte les faces répétées du Dé mystique", () => {
    const dice = CLASS_DICE[PlayerClass.Wizard];

    const firstTwo = rollDice(dice, () => 0.17);
    const secondTwo = rollDice(dice, () => 0.33);

    expect(firstTwo).toBe(2);
    expect(secondTwo).toBe(2);
  });

  it("lance le dé correspondant à la classe", () => {
  expect(
    rollClassDice(PlayerClass.Warrior, () => 0),
  ).toBe(1);

  expect(
    rollClassDice(PlayerClass.Archer, () => 0),
  ).toBe(2);

  expect(
    rollClassDice(PlayerClass.Wizard, () => 0.999999),
  ).toBe(4);

  expect(
    rollClassDice(PlayerClass.Paladin, () => 0.999999),
  ).toBe(7);
});
});