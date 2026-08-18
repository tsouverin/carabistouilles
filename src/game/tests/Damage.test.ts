import { describe, expect, it } from "vitest";
import {
  applyDamage,
  type DamageEffect,
} from "../Damage";
import { Element } from "../Element";
import {
  createPlayer,
  type Player,
} from "../Player";
import { PlayerClass, PlayerStatus } from "../types";

function createTestPlayer(
  id = "p1",
): Player {
  return createPlayer(
    id,
    `Player ${id}`,
    PlayerClass.Warrior,
  );
}

function createDamageEffect(
  overrides: Partial<DamageEffect> = {},
): DamageEffect {
  return {
    sourceId: "p1",
    targetId: "p2",
    amount: 1,
    ...overrides,
  };
}

describe("applyDamage", () => {
  it("applique les dégâts aux PB lorsqu'ils sont présents", () => {
    const target = createTestPlayer("p2");

    target.shield = 3;
    target.hp = 10;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
      }),
    );

    expect(result.shieldDamage).toBe(2);
    expect(result.hpDamage).toBe(0);
    expect(result.remainingShield).toBe(1);
    expect(result.remainingHp).toBe(10);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(false);
  });

  it("dissipe l'excédent lorsque les dégâts dépassent les PB", () => {
    const target = createTestPlayer("p2");

    target.shield = 1;
    target.hp = 10;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 3,
      }),
    );

    expect(result.shieldDamage).toBe(1);
    expect(result.hpDamage).toBe(0);
    expect(result.remainingShield).toBe(0);
    expect(result.remainingHp).toBe(10);
    expect(result.dissipatedDamage).toBe(2);
    expect(result.killed).toBe(false);
  });

  it("applique les dégâts aux PV lorsque la cible n'a plus de PB", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 3,
      }),
    );

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(3);
    expect(result.remainingShield).toBe(0);
    expect(result.remainingHp).toBe(7);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(false);
  });

  it("dissipe l'excédent lorsque les dégâts détruisent les derniers PB", () => {
    const target = createTestPlayer("p2");

    target.shield = 2;
    target.hp = 10;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 4,
      }),
    );

    expect(result.shieldDamage).toBe(2);
    expect(result.hpDamage).toBe(0);
    expect(result.remainingShield).toBe(0);
    expect(result.remainingHp).toBe(10);
    expect(result.dissipatedDamage).toBe(2);
    expect(result.killed).toBe(false);
  });

  it("peut tuer un joueur lorsque celui-ci n'a plus de PB", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 1;
    target.status = PlayerStatus.Alive;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 1,
      }),
    );

    expect(result.hpDamage).toBe(1);
    expect(result.remainingHp).toBe(0);
    expect(result.killed).toBe(true);
    expect(target.status).toBe(PlayerStatus.Dead);
  });

  it("ignore les PB lorsqu'une attaque traverse le bouclier", () => {
    const target = createTestPlayer("p2");

    target.shield = 5;
    target.hp = 10;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        ignoresShield: true,
      }),
    );

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(2);
    expect(result.remainingShield).toBe(5);
    expect(result.remainingHp).toBe(8);
    expect(result.dissipatedDamage).toBe(0);
    expect(result.killed).toBe(false);
  });

  it("peut tuer un joueur avec une attaque qui traverse le bouclier", () => {
    const target = createTestPlayer("p2");

    target.shield = 5;
    target.hp = 1;
    target.status = PlayerStatus.Alive;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 1,
        ignoresShield: true,
      }),
    );

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(1);
    expect(result.remainingShield).toBe(5);
    expect(result.remainingHp).toBe(0);
    expect(result.killed).toBe(true);
    expect(target.status).toBe(PlayerStatus.Dead);
  });

  it("refuse une quantité de dégâts invalide", () => {
    const target = createTestPlayer("p2");

    expect(() =>
      applyDamage(
        target,
        createDamageEffect({
          amount: 0,
        }),
      ),
    ).toThrow(
      "Damage amount must be a positive integer.",
    );

    expect(() =>
      applyDamage(
        target,
        createDamageEffect({
          amount: -1,
        }),
      ),
    ).toThrow(
      "Damage amount must be a positive integer.",
    );

    expect(() =>
      applyDamage(
        target,
        createDamageEffect({
          amount: 1.5,
        }),
      ),
    ).toThrow(
      "Damage amount must be a positive integer.",
    );
  });
});

describe("avantage élémentaire", () => {
  it("le Feu inflige 1 dégât supplémentaire contre l'Air", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Air;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Fire,
      }),
    );

    expect(result.elementalAdvantage).toBe(true);
    expect(result.elementalBonusDamage).toBe(1);

    expect(result.hpDamage).toBe(3);
    expect(target.hp).toBe(7);
  });

  it("la Terre inflige 1 dégât supplémentaire contre l'Eau", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Water;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Earth,
      }),
    );

    expect(result.elementalAdvantage).toBe(true);
    expect(result.elementalBonusDamage).toBe(1);
    expect(result.hpDamage).toBe(3);
  });

  it("l'Eau inflige 1 dégât supplémentaire contre le Feu", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Fire;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Water,
      }),
    );

    expect(result.elementalAdvantage).toBe(true);
    expect(result.elementalBonusDamage).toBe(1);
    expect(result.hpDamage).toBe(3);
  });

  it("l'Air inflige 1 dégât supplémentaire contre la Terre", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Earth;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Air,
      }),
    );

    expect(result.elementalAdvantage).toBe(true);
    expect(result.elementalBonusDamage).toBe(1);
    expect(result.hpDamage).toBe(3);
  });

  it("n'accorde aucun bonus lorsque les éléments sont identiques", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Fire;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Fire,
      }),
    );

    expect(result.elementalAdvantage).toBe(false);
    expect(result.elementalBonusDamage).toBe(0);
    expect(result.hpDamage).toBe(2);
  });

  it("n'accorde aucun bonus lorsque l'attaquant est désavantagé", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Water;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Fire,
      }),
    );

    expect(result.elementalAdvantage).toBe(false);
    expect(result.elementalBonusDamage).toBe(0);
    expect(result.hpDamage).toBe(2);
  });

  it("n'accorde aucun bonus lorsqu'il n'y a pas d'élément offensif", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = Element.Air;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
      }),
    );

    expect(result.elementalAdvantage).toBe(false);
    expect(result.elementalBonusDamage).toBe(0);
    expect(result.hpDamage).toBe(2);
  });

  it("n'accorde aucun bonus lorsque la cible n'a pas de voie élémentaire", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 10;
    target.element = null;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        elementalAttack: Element.Fire,
      }),
    );

    expect(result.elementalAdvantage).toBe(false);
    expect(result.elementalBonusDamage).toBe(0);
    expect(result.hpDamage).toBe(2);
  });

it("applique le bonus élémentaire aux PB avant les PV", () => {
  const target = createTestPlayer("p2");

  target.shield = 2;
  target.hp = 10;
  target.element = Element.Air;

  const result = applyDamage(
    target,
    createDamageEffect({
      amount: 2,
      elementalAttack: Element.Fire,
    }),
  );

  // 2 dégâts de base + 1 de bonus élémentaire = 3.
  expect(result.elementalBonusDamage).toBe(1);

  // Les 2 PB absorbent les 2 premiers dégâts.
  expect(result.shieldDamage).toBe(2);

  // Le surplus ne traverse pas le bouclier.
  expect(result.hpDamage).toBe(0);

  expect(result.remainingShield).toBe(0);
  expect(result.remainingHp).toBe(10);

  // 1 dégât sur les 3 est dissipé.
  expect(result.dissipatedDamage).toBe(1);
});
  it("applique le bonus élémentaire aux dégâts perforants", () => {
    const target = createTestPlayer("p2");

    target.shield = 5;
    target.hp = 10;
    target.element = Element.Air;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 2,
        ignoresShield: true,
        elementalAttack: Element.Fire,
      }),
    );

    expect(result.elementalAdvantage).toBe(true);
    expect(result.elementalBonusDamage).toBe(1);

    expect(result.shieldDamage).toBe(0);
    expect(result.hpDamage).toBe(3);

    expect(target.shield).toBe(5);
    expect(target.hp).toBe(7);
  });

  it("le bonus élémentaire peut tuer une cible", () => {
    const target = createTestPlayer("p2");

    target.shield = 0;
    target.hp = 2;
    target.element = Element.Air;
    target.status = PlayerStatus.Alive;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 1,
        elementalAttack: Element.Fire,
      }),
    );

    // 1 dégât de base + 1 de bonus = 2.
    expect(result.elementalBonusDamage).toBe(1);
    expect(result.hpDamage).toBe(2);
    expect(result.remainingHp).toBe(0);
    expect(result.killed).toBe(true);
    expect(target.status).toBe(PlayerStatus.Dead);
  });

  it("le bonus élémentaire est pris en compte dans les dégâts dissipés", () => {
    const target = createTestPlayer("p2");

    target.shield = 1;
    target.hp = 10;
    target.element = Element.Air;

    const result = applyDamage(
      target,
      createDamageEffect({
        amount: 1,
        elementalAttack: Element.Fire,
      }),
    );

    // 1 dégât de base + 1 bonus.
    // Le premier casse le PB, le second est dissipé.
    expect(result.shieldDamage).toBe(1);
    expect(result.hpDamage).toBe(0);
    expect(result.elementalBonusDamage).toBe(1);
    expect(result.dissipatedDamage).toBe(1);
  });
});
