import { describe, expect, it } from "vitest";
import { createPlayer, getPlayer } from "../Player";
import { PlayerClass, PlayerStatus } from "../types";

describe("createPlayer", () => {
  it("crée un joueur avec ses valeurs initiales", () => {
    const player = createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    );

    expect(player.id).toBe("player-1");
    expect(player.name).toBe("Alice");
    expect(player.class).toBe(PlayerClass.Warrior);

    expect(player.hp).toBe(10);
    expect(player.shield).toBe(5);

    expect(player.element).toBeNull();

    expect(player.hand).toHaveLength(0);
    expect(player.hiddenCards).toHaveLength(0);

    expect(player.status).toBe(PlayerStatus.Alive);
  });

    it("retrouve un joueur grâce à son identifiant", () => {
    const alice = createPlayer(
        "player-1",
        "Alice",
        PlayerClass.Warrior,
    );

    const bob = createPlayer(
        "player-2",
        "Bob",
        PlayerClass.Paladin,
    );

    const player = getPlayer(
        [alice, bob],
        "player-2",
    );

    expect(player).toBe(bob);
    });

    it("signale une erreur si le joueur n'existe pas", () => {
    const alice = createPlayer(
        "player-1",
        "Alice",
        PlayerClass.Warrior,
    );

    expect(() =>
        getPlayer([alice], "player-999"),
    ).toThrow('Player "player-999" not found.');
    });
});