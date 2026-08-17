import { describe, expect, it } from "vitest";
import { createPlayer } from "../Player";
import { applyHealing } from "../Healing";
import { PlayerClass } from "../types";

function createTestPlayer() {
  return createPlayer(
    "player-1",
    "Alice",
    PlayerClass.Warrior,
  );
}

describe("applyHealing", () => {
  it("soigne les PV", () => {
    const player = createTestPlayer();

    player.hp = 6;

    const result = applyHealing(player, {
      targetId: player.id,
      amount: 2,
      type: "hp",
    });

    expect(player.hp).toBe(8);
    expect(result.healed).toBe(2);
    expect(result.dissipatedHealing).toBe(0);
  });

  it("restaure les PB", () => {
    const player = createTestPlayer();

    player.shield = 5;

    const result = applyHealing(player, {
      targetId: player.id,
      amount: 3,
      type: "shield",
    });

    expect(player.shield).toBe(8);
    expect(result.healed).toBe(3);
    expect(result.dissipatedHealing).toBe(0);
  });

  it("ne peut pas dépasser 10 PV", () => {
    const player = createTestPlayer();

    player.hp = 9;

    const result = applyHealing(player, {
      targetId: player.id,
      amount: 3,
      type: "hp",
    });

    expect(player.hp).toBe(10);
    expect(result.healed).toBe(1);
    expect(result.dissipatedHealing).toBe(2);
  });

  it("ne peut pas dépasser 10 PB", () => {
    const player = createTestPlayer();

    player.shield = 9;

    const result = applyHealing(player, {
      targetId: player.id,
      amount: 3,
      type: "shield",
    });

    expect(player.shield).toBe(10);
    expect(result.healed).toBe(1);
    expect(result.dissipatedHealing).toBe(2);
  });

  it("dissipe tous les soins si les PV sont déjà au maximum", () => {
    const player = createTestPlayer();

    player.hp = 10;

    const result = applyHealing(player, {
      targetId: player.id,
      amount: 2,
      type: "hp",
    });

    expect(player.hp).toBe(10);
    expect(result.healed).toBe(0);
    expect(result.dissipatedHealing).toBe(2);
  });

  it("dissipe tous les soins si les PB sont déjà au maximum", () => {
    const player = createTestPlayer();

    player.shield = 10;

    const result = applyHealing(player, {
      targetId: player.id,
      amount: 2,
      type: "shield",
    });

    expect(player.shield).toBe(10);
    expect(result.healed).toBe(0);
    expect(result.dissipatedHealing).toBe(2);
  });

  it("refuse une quantité de soins invalide", () => {
    const player = createTestPlayer();

    expect(() =>
      applyHealing(player, {
        targetId: player.id,
        amount: 0,
        type: "hp",
      }),
    ).toThrow("Healing amount must be a positive integer.");
  });

  it("refuse une quantité de soins négative", () => {
    const player = createTestPlayer();

    expect(() =>
      applyHealing(player, {
        targetId: player.id,
        amount: -1,
        type: "hp",
      }),
    ).toThrow("Healing amount must be a positive integer.");
  });
});