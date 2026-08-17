import { describe, expect, it } from "vitest";

import {
  drawCardForPlayer,
  placeHiddenCardForPlayer,
  useCardForPlayer,
  playElementalPathForPlayer,
} from "../Actions";
import { createGameState } from "../GameState";
import { createPlayer } from "../Player";
import { createDeck } from "../Deck";
import { startTurn } from "../Turn";

import {
  AttackCard,
  CardType,
  PotionCard,
  type Card,
} from "../Cards";
import { Element } from "../Element";

import { PlayerClass } from "../types";

function createTestCard(id: string): Card {
  return {
    id,
    name: `Flèche ${id}`,
    type: CardType.Attack,
    attack: AttackCard.Arrow,
  };
}

function createAttackCard(
  id: string,
  attack: AttackCard,
): Card {
  return {
    id,
    name: `Attack ${id}`,
    type: CardType.Attack,
    attack,
  };
}

function createPotionCard(
  id: string,
  potion: PotionCard,
): Card {
  return {
    id,
    name: `Potion ${id}`,
    type: CardType.Potion,
    potion,
  };
}

function createElementalPathCard(id: string): Card {
  return {
    id,
    name: `Voie élémentaire ${id}`,
    type: CardType.ElementalPath,
  };
}

function createElementalAttackCard(
  id: string,
  attack: AttackCard,
): Card {
  return {
    id,
    name: `Attaque élémentaire ${id}`,
    type: CardType.ElementalAttack,
    attack,
  };
}

function createElementalPotionCard(
  id: string,
  potion: PotionCard,
): Card {
  return {
    id,
    name: `Potion élémentaire ${id}`,
    type: CardType.ElementalPotion,
    potion,
  };
}

function createTestGame() {
  const players = [
    createPlayer(
      "player-1",
      "Alice",
      PlayerClass.Warrior,
    ),
    createPlayer(
      "player-2",
      "Bob",
      PlayerClass.Paladin,
    ),
    createPlayer(
      "player-3",
      "Charlie",
      PlayerClass.Archer,
    ),
    createPlayer(
      "player-4",
      "Diana",
      PlayerClass.Wizard,
    ),
  ];

  const game = createGameState(players);

  game.deck = createDeck([
    createTestCard("card-1"),
    createTestCard("card-2"),
  ]);

  return game;
}

describe("drawCardForPlayer", () => {
  it("fait piocher une carte au joueur actif", () => {
    const game = createTestGame();

    startTurn(
      game,
      "player-1",
      () => 0,
    );

    drawCardForPlayer(
      game,
      "player-1",
    );

    expect(game.players[0].hand).toHaveLength(1);
    expect(game.players[0].hand[0].id).toBe("card-2");
  });

  it("consomme une action", () => {
    const game = createTestGame();

    startTurn(
      game,
      "player-1",
      () => 0.5,
    );

    const actionsBefore =
      game.actionsRemaining;

    drawCardForPlayer(
      game,
      "player-1",
    );

    expect(game.actionsRemaining).toBe(
      actionsBefore - 1,
    );
  });

  it("retire la carte de la pioche", () => {
    const game = createTestGame();

    startTurn(
      game,
      "player-1",
      () => 0,
    );

    drawCardForPlayer(
      game,
      "player-1",
    );

    expect(
      game.deck.drawPile,
    ).toHaveLength(1);
  });

  it("empêche un joueur qui n'est pas actif de piocher", () => {
    const game = createTestGame();

    startTurn(
      game,
      "player-1",
      () => 0,
    );

    expect(() =>
      drawCardForPlayer(
        game,
        "player-2",
      ),
    ).toThrow(
      "This player is not currently playing.",
    );
  });

  it("empêche de piocher lorsqu'il ne reste plus d'action", () => {
    const game = createTestGame();

    startTurn(
      game,
      "player-1",
      () => 0,
    );

    expect(game.actionsRemaining).toBe(1);

    drawCardForPlayer(
      game,
      "player-1",
    );

    expect(game.actionsRemaining).toBe(0);

    expect(() =>
      drawCardForPlayer(
        game,
        "player-1",
      ),
    ).toThrow(
      "No actions remaining.",
    );
  });

  it("recycle la défausse lorsque la pioche est vide", () => {
    const game = createTestGame();

    const discardedCard =
      createTestCard("discarded-card");

    game.deck = createDeck();

    game.deck.discardPile.push(
      discardedCard,
    );

    startTurn(
      game,
      "player-1",
      () => 0,
    );

    drawCardForPlayer(
      game,
      "player-1",
      () => 0,
    );

    expect(
      game.players[0].hand,
    ).toHaveLength(1);

    expect(
      game.players[0].hand[0].id,
    ).toBe("discarded-card");

    expect(
      game.deck.discardPile,
    ).toHaveLength(0);
  });

  it("ne fait pas planter le jeu si aucune carte n'est disponible", () => {
    const game = createTestGame();

    game.deck = createDeck();

    startTurn(
      game,
      "player-1",
      () => 0,
    );

    drawCardForPlayer(
      game,
      "player-1",
    );

    expect(
      game.players[0].hand,
    ).toHaveLength(0);

    expect(
      game.actionsRemaining,
    ).toBe(0);
  });
});

describe("useCardForPlayer", () => {
  it("utilise une carte d'attaque, consomme une action et défausse la carte", () => {
    const game = createTestGame();

    const attackCard = createAttackCard(
      "attack-1",
      AttackCard.Sword,
    );

    game.players[0].hand.push(attackCard);

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "attack-1",
      "player-2",
    );

    expect(result.cardType).toBe(CardType.Attack);
    expect(result.targetId).toBe("player-2");
    expect(result.damage?.shieldDamage).toBe(1);
    expect(result.classPowerTriggered).toBe(false);

    expect(game.players[1].shield).toBe(4);
    expect(game.players[1].hp).toBe(10);

    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
    expect(game.actionsRemaining).toBe(0);
  });

  it("utilise une potion de vie sur soi-même par défaut", () => {
    const game = createTestGame();

    const potion = createPotionCard(
      "potion-hp-1",
      PotionCard.Health,
    );

    game.players[0].hand.push(potion);
    game.players[0].hp = 6;

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "potion-hp-1",
    );

    expect(result.cardType).toBe(CardType.Potion);
    expect(result.targetId).toBe("player-1");
    expect(result.healing?.healed).toBe(1);

    expect(game.players[0].hp).toBe(7);
    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
    expect(game.actionsRemaining).toBe(0);
  });

  it("utilise une potion de bouclier et respecte le plafond", () => {
    const game = createTestGame();

    const potion = createPotionCard(
      "potion-shield-1",
      PotionCard.Shield,
    );

    game.players[0].hand.push(potion);
    game.players[0].shield = 9;

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "potion-shield-1",
    );

    expect(result.healing?.healed).toBe(1);
    expect(result.healing?.dissipatedHealing).toBe(0);
    expect(game.players[0].shield).toBe(10);
    expect(game.deck.discardPile).toHaveLength(1);
  });

  it("déclenche le pouvoir bonus si la carte est associée à la classe", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-associated-1",
      AttackCard.Club,
    );

    game.players[0].hand.push(associatedAttack);

    startTurn(game, "player-1", () => 0);

    const result = useCardForPlayer(
      game,
      "player-1",
      "attack-associated-1",
      "player-2",
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBe("warriorBonusDamage");
    expect(result.damage?.shieldDamage).toBe(1);
    expect(result.bonusDamage?.shieldDamage).toBe(1);
    expect(game.players[1].shield).toBe(3);
    expect(game.players[1].hp).toBe(10);
  });

  it("déclenche un soin de bouclier pour le paladin", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-associated-paladin",
      AttackCard.Sword,
    );

    game.players[1].hand.push(associatedAttack);
    game.players[1].shield = 4;

    startTurn(game, "player-2", () => 0);

    const result = useCardForPlayer(
      game,
      "player-2",
      "attack-associated-paladin",
      "player-1",
      { classPowerTargetId: "player-3" },
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBe("paladinShieldBlessing");
    expect(result.bonusHealing?.healed).toBe(1);
    expect(game.players[2].shield).toBe(6);
    expect(game.players[1].shield).toBe(4);
  });

  it("déclenche un dégât perforant pour l'archer", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-associated-archer",
      AttackCard.Arrow,
    );

    game.players[2].hand.push(associatedAttack);

    startTurn(game, "player-3", () => 0);

    const result = useCardForPlayer(
      game,
      "player-3",
      "attack-associated-archer",
      "player-1",
      { archerMode: "piercing" },
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBe("archerPiercingDamage");
    expect(result.damage?.shieldDamage).toBe(1);
    expect(result.bonusDamage?.hpDamage).toBe(1);
    expect(game.players[0].shield).toBe(4);
    expect(game.players[0].hp).toBe(9);
  });

  it("peut appliquer 2 dégâts de PB avec le pouvoir de l'archer", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-associated-archer-shield",
      AttackCard.Arrow,
    );

    game.players[2].hand.push(associatedAttack);

    startTurn(game, "player-3", () => 0);

    const result = useCardForPlayer(
      game,
      "player-3",
      "attack-associated-archer-shield",
      "player-1",
      { archerMode: "shieldBreak" },
    );

    expect(result.classPowerTriggered).toBe(true);
    expect(result.classPowerEffect).toBe("archerShieldBreakDamage");
    expect(result.damage?.shieldDamage).toBe(1);
    expect(result.bonusDamage?.shieldDamage).toBe(2);
    expect(result.bonusDamage?.hpDamage).toBe(0);
    expect(game.players[0].shield).toBe(2);
    expect(game.players[0].hp).toBe(10);
  });

  it("le parchemin de Feu inflige un dégât bonus", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-wizard-fire",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);

    startTurn(game, "player-4", () => 0);

    const result = useCardForPlayer(
      game,
      "player-4",
      "attack-wizard-fire",
      "player-1",
      { wizardElement: Element.Fire },
    );

    expect(result.classPowerEffect).toBe("fireBonusDamage");
    expect(result.bonusDamage?.shieldDamage).toBe(1);
    expect(game.players[0].shield).toBe(3);
  });

  it("le parchemin d'Eau restaure 1 PB sur le sorcier", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-wizard-water",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);
    game.players[3].shield = 3;

    startTurn(game, "player-4", () => 0);

    const result = useCardForPlayer(
      game,
      "player-4",
      "attack-wizard-water",
      "player-1",
      { wizardElement: Element.Water },
    );

    expect(result.classPowerEffect).toBe("waterShieldHeal");
    expect(result.bonusHealing?.healed).toBe(1);
    expect(game.players[3].shield).toBe(4);
  });

  it("le parchemin de Terre brise 1 PB sur une cible de son choix", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-wizard-earth",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);

    startTurn(game, "player-4", () => 0);

    const result = useCardForPlayer(
      game,
      "player-4",
      "attack-wizard-earth",
      "player-1",
      { wizardElement: Element.Earth, classPowerTargetId: "player-2" },
    );

    expect(result.classPowerEffect).toBe("earthShieldBreak");
    expect(result.bonusShieldBreak?.shieldBroken).toBe(1);
    expect(game.players[1].shield).toBe(4);
  });

  it("le parchemin de Terre peut cibler le sorcier lui-même", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-wizard-earth-self",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);
    game.players[3].shield = 5;

    startTurn(game, "player-4", () => 0);

    const result = useCardForPlayer(
      game,
      "player-4",
      "attack-wizard-earth-self",
      "player-1",
      { wizardElement: Element.Earth },
    );

    expect(result.classPowerEffect).toBe("earthShieldBreak");
    expect(result.bonusShieldBreak?.shieldBroken).toBe(1);
    expect(game.players[3].shield).toBe(4);
  });

  it("le parchemin d'Air fait piocher une carte", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-wizard-air",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);

    startTurn(game, "player-4", () => 0);

    const result = useCardForPlayer(
      game,
      "player-4",
      "attack-wizard-air",
      "player-1",
      { wizardElement: Element.Air },
    );

    expect(result.classPowerEffect).toBe("airCardDraw");
    expect(result.drawnCardId).toBeDefined();
    expect(game.players[3].hand).toHaveLength(1);
  });

  it("le parchemin ne modifie pas la voie élémentaire permanente du sorcier", () => {
    const game = createTestGame();

    game.players[3].element = Element.Water;

    const associatedAttack = createAttackCard(
      "attack-wizard-independent",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);

    startTurn(game, "player-4", () => 0);

    useCardForPlayer(
      game,
      "player-4",
      "attack-wizard-independent",
      "player-1",
      { wizardElement: Element.Fire },
    );

    expect(game.players[3].element).toBe(Element.Water);
  });

  it("refuse le pouvoir du sorcier sans choix d'élément", () => {
    const game = createTestGame();

    const associatedAttack = createAttackCard(
      "attack-associated-wizard-no-element",
      AttackCard.Scroll,
    );

    game.players[3].hand.push(associatedAttack);

    startTurn(game, "player-4", () => 0);

    expect(() =>
      useCardForPlayer(
        game,
        "player-4",
        "attack-associated-wizard-no-element",
        "player-1",
      ),
    ).toThrow("Wizard must choose an elemental passive.");
  });

  it("refuse une attaque sans cible", () => {
    const game = createTestGame();

    const attackCard = createAttackCard(
      "attack-2",
      AttackCard.Arrow,
    );

    game.players[0].hand.push(attackCard);

    startTurn(game, "player-1", () => 0);

    expect(() =>
      useCardForPlayer(
        game,
        "player-1",
        "attack-2",
      ),
    ).toThrow("Attack cards require a target.");

    expect(game.players[0].hand).toHaveLength(1);
    expect(game.deck.discardPile).toHaveLength(0);
    expect(game.actionsRemaining).toBe(1);
  });
});

describe("placeHiddenCardForPlayer", () => {
  it("pose une carte cachée depuis la main et consomme une action", () => {
    const game = createTestGame();

    const card = createAttackCard(
      "hidden-1",
      AttackCard.Arrow,
    );

    game.players[0].hand.push(card);

    startTurn(game, "player-1", () => 0);

    const result = placeHiddenCardForPlayer(
      game,
      "player-1",
      "hidden-1",
    );

    expect(result.cardId).toBe("hidden-1");
    expect(result.hiddenCardsCount).toBe(1);
    expect(game.players[0].hand).toHaveLength(0);
    expect(game.players[0].hiddenCards).toHaveLength(1);
    expect(game.players[0].hiddenCards[0].id).toBe("hidden-1");
    expect(game.actionsRemaining).toBe(0);
  });

  it("refuse si la limite de cartes cachées est atteinte", () => {
    const game = createTestGame();

    game.players[0].hiddenCards.push(
      createAttackCard("existing-1", AttackCard.Arrow),
      createAttackCard("existing-2", AttackCard.Club),
    );
    game.players[0].hand.push(
      createAttackCard("hidden-2", AttackCard.Sword),
    );

    startTurn(game, "player-1", () => 0);

    expect(() =>
      placeHiddenCardForPlayer(
        game,
        "player-1",
        "hidden-2",
      ),
    ).toThrow("Hidden card limit reached.");

    expect(game.players[0].hand).toHaveLength(1);
    expect(game.players[0].hiddenCards).toHaveLength(2);
    expect(game.actionsRemaining).toBe(1);
  });

  it("refuse pour un joueur non actif", () => {
    const game = createTestGame();

    game.players[0].hand.push(
      createAttackCard("hidden-3", AttackCard.Arrow),
    );

    startTurn(game, "player-1", () => 0);

    expect(() =>
      placeHiddenCardForPlayer(
        game,
        "player-2",
        "hidden-3",
      ),
    ).toThrow("This player is not currently playing.");

    expect(game.players[0].hand).toHaveLength(1);
    expect(game.players[0].hiddenCards).toHaveLength(0);
  });

  it("refuse quand il ne reste plus d'action", () => {
    const game = createTestGame();

    game.players[0].hand.push(
      createAttackCard("hidden-4", AttackCard.Arrow),
    );

    startTurn(game, "player-1", () => 0);
    drawCardForPlayer(game, "player-1");

    expect(() =>
      placeHiddenCardForPlayer(
        game,
        "player-1",
        "hidden-4",
      ),
    ).toThrow("No actions remaining.");

    expect(game.players[0].hand).toHaveLength(2);
    expect(game.players[0].hiddenCards).toHaveLength(0);
  });

  it("refuse si la carte n'est pas dans la main", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);

    expect(() =>
      placeHiddenCardForPlayer(
        game,
        "player-1",
        "missing-card",
      ),
    ).toThrow("Card is not in player's hand.");

    expect(game.players[0].hiddenCards).toHaveLength(0);
    expect(game.actionsRemaining).toBe(1);
  });
});

describe("playElementalPathForPlayer", () => {
  it("choisit un élément et défausse la carte", () => {
    const game = createTestGame();

    const pathCard = createElementalPathCard("path-1");

    game.players[0].hand.push(pathCard);

    startTurn(game, "player-1", () => 0);

    const result = playElementalPathForPlayer(
      game,
      "player-1",
      "path-1",
      Element.Fire,
    );

    expect(result.cardId).toBe("path-1");
    expect(result.element).toBe(Element.Fire);
    expect(result.previousElement).toBeNull();
    expect(game.players[0].element).toBe(Element.Fire);
    expect(game.players[0].hand).toHaveLength(0);
    expect(game.deck.discardPile).toHaveLength(1);
    expect(game.actionsRemaining).toBe(0);
  });

  it("remplace un élément précédent", () => {
    const game = createTestGame();

    game.players[0].element = Element.Water;

    const pathCard = createElementalPathCard("path-2");

    game.players[0].hand.push(pathCard);

    startTurn(game, "player-1", () => 0);

    const result = playElementalPathForPlayer(
      game,
      "player-1",
      "path-2",
      Element.Earth,
    );

    expect(result.element).toBe(Element.Earth);
    expect(result.previousElement).toBe(Element.Water);
    expect(game.players[0].element).toBe(Element.Earth);
  });

  it("refuse pour un joueur non actif", () => {
    const game = createTestGame();

    const pathCard = createElementalPathCard("path-3");

    game.players[0].hand.push(pathCard);

    startTurn(game, "player-1", () => 0);

    expect(() =>
      playElementalPathForPlayer(
        game,
        "player-2",
        "path-3",
        Element.Air,
      ),
    ).toThrow("This player is not currently playing.");
  });

  it("refuse si la carte n'est pas une voie élémentaire", () => {
    const game = createTestGame();

    const attackCard = createAttackCard(
      "attack-1",
      AttackCard.Arrow,
    );

    game.players[0].hand.push(attackCard);

    startTurn(game, "player-1", () => 0);

    expect(() =>
      playElementalPathForPlayer(
        game,
        "player-1",
        "attack-1",
        Element.Fire,
      ),
    ).toThrow("This card is not an elemental path.");
  });

  it("refuse si la carte n'est pas dans la main", () => {
    const game = createTestGame();

    startTurn(game, "player-1", () => 0);

    expect(() =>
      playElementalPathForPlayer(
        game,
        "player-1",
        "missing-path",
        Element.Water,
      ),
    ).toThrow("Card is not in player's hand.");
  });

  it("refuse quand il ne reste plus d'action", () => {
    const game = createTestGame();

    const pathCard = createElementalPathCard("path-4");

    game.players[0].hand.push(pathCard);

    startTurn(game, "player-1", () => 0);
    drawCardForPlayer(game, "player-1");

    expect(() =>
      playElementalPathForPlayer(
        game,
        "player-1",
        "path-4",
        Element.Earth,
      ),
    ).toThrow("No actions remaining.");

    expect(game.players[0].element).toBeNull();
  });
});