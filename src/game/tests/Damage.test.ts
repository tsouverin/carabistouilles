import { describe, expect, it } from "vitest";
import { applyDamage } from "../Damage";
import { createPlayer } from "../Player";
import { PlayerClass, PlayerStatus } from "../types";

describe("applyDamage", () => {
  it("applique les dégâts aux PB lorsqu'ils sont présents", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    const result = applyDamage(player, {
      sourceId: "player-2",
      targetId: "player-1",
      amount: 3,
    });

    expect(player.shield).toBe(2);
    expect(player.hp).toBe(10);

    expect(result.shieldDamage).toBe(3);
    expect(result.hpDamage).toBe(0);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(false);
  });

  it("dissipe l'excédent lorsque les dégâts dépassent les PB", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    const result = applyDamage(player, {
      sourceId: "player-2",
      targetId: "player-1",
      amount: 7,
    });

    expect(player.shield).toBe(0);
    expect(player.hp).toBe(10);

    expect(result.shieldDamage).toBe(5);
    expect(result.hpDamage).toBe(0);
    expect(result.dissipatedDamage).toBe(2);
    expect(result.killed).toBe(false);
  });

  it("applique les dégâts aux PV lorsque la cible n'a plus de PB", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    player.shield = 0;

    const result = applyDamage(player, {
      sourceId: "player-2",
      targetId: "player-1",
      amount: 3,
    });

    expect(player.shield).toBe(0);
    expect(player.hp).toBe(7);

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(3);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(false);
  });

  it("dissipe l'excédent lorsque les dégâts détruisent les derniers PB", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    player.shield = 2;

    const result = applyDamage(player, {
      sourceId: "player-2",
      targetId: "player-1",
      amount: 5,
    });

    expect(player.shield).toBe(0);
    expect(player.hp).toBe(10);

    expect(result.shieldDamage).toBe(2);
    expect(result.hpDamage).toBe(0);
    expect(result.dissipatedDamage).toBe(3);
    expect(result.killed).toBe(false);
  });

    it("peut tuer un joueur lorsque celui-ci n'a plus de PB", () => {
    const player = createPlayer(
        "player-1",
        "Alice",
        PlayerClass.Warrior,
    );

    player.shield = 0;
    player.hp = 3;

    const result = applyDamage(player, {
        sourceId: "player-2",
        targetId: "player-1",
        amount: 3,
    });

    expect(player.shield).toBe(0);
    expect(player.hp).toBe(0);
    expect(player.status).toBe(PlayerStatus.Dead);

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(3);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(true);
    });

  it("ignore les PB lorsqu'une attaque traverse le bouclier", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    const result = applyDamage(player, {
      sourceId: "player-2",
      targetId: "player-1",
      amount: 2,
      ignoresShield: true,
    });

    expect(player.shield).toBe(5);
    expect(player.hp).toBe(8);

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(2);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(false);
  });

  it("peut tuer un joueur avec une attaque qui traverse le bouclier", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    const result = applyDamage(player, {
      sourceId: "player-2",
      targetId: "player-1",
      amount: 12,
      ignoresShield: true,
    });

    expect(player.shield).toBe(5);
    expect(player.hp).toBe(0);

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(10);
    expect(result.dissipatedDamage).toBe(2);
    expect(result.killed).toBe(true);
  });

  it("refuse une quantité de dégâts invalide", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    expect(() =>
      applyDamage(player, {
        sourceId: "player-2",
        targetId: "player-1",
        amount: 0,
      }),
    ).toThrow("Damage amount must be a positive integer.");

    expect(() =>
      applyDamage(player, {
        sourceId: "player-2",
        targetId: "player-1",
        amount: -2,
      }),
    ).toThrow("Damage amount must be a positive integer.");

    expect(() =>
      applyDamage(player, {
        sourceId: "player-2",
        targetId: "player-1",
        amount: 1.5,
      }),
    ).toThrow("Damage amount must be a positive integer.");
  });
});