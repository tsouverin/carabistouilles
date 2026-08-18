import { useState } from "react";
import "./App.css";

import {
  createGameState,
  type GameState,
} from "./game/GameState";

import {
  createPlayer,
} from "./game/Player";

import {
  PlayerClass,
  PlayerStatus,
} from "./game/types";

import {
  startGame,
  performAction,
  getActivePlayer,
  type GameAction,
} from "./game/Game";

import {
  CardType,
  type Card,
  isAssociatedAttackForClass,
} from "./game/Cards";

import {
  Element,
} from "./game/Element";

function createInitialGame(): GameState {
  return createGameState([
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
      "Diane",
      PlayerClass.Wizard,
    ),
  ]);
}

function App() {
  const [game, setGame] =
    useState<GameState>(
      createInitialGame,
    );

  const [selectedCardId, setSelectedCardId] =
    useState<string | null>(null);

  const [selectedTargetId, setSelectedTargetId] =
    useState<string | null>(null);
  
  const [selectedElementTargetId, setSelectedElementTargetId] =
    useState<string | null>(null);

  const [wizardElement, setWizardElement] =
    useState<Element | null | undefined>(
      undefined,
    );

  const [pathElement, setPathElement] =
    useState<Element | null>(null);

  const isWaiting =
    game.status === "waiting";

  const isPlaying =
    game.status === "playing";

  const activePlayer =
    isPlaying
      ? getActivePlayer(game)
      : null;

  const activeHand =
    activePlayer?.hand ?? [];

  const selectedCard =
    activeHand.find(
      (card) =>
        card.id === selectedCardId,
    ) ?? null;

  function resetSelection() {
    setSelectedCardId(null);
    setSelectedTargetId(null);
    setWizardElement(undefined);
    setPathElement(null);
    setSelectedElementTargetId(null);
  }

  function updateGame(
    action: GameAction,
  ) {
    const nextGame =
      structuredClone(game);

    performAction(
      nextGame,
      action,
    );

    setGame(nextGame);
    resetSelection();
  }

  function handleStartGame() {
    const nextGame =
      structuredClone(game);

    startGame(nextGame);

    setGame(nextGame);
  }

  function handleCardClick(
    card: Card,
  ) {
    if (
      game.actionsRemaining <= 0
    ) {
      return;
    }

    // Les Carabistouilles ne sont volontairement
    // pas encore jouables.
    if (
      card.type === CardType.Trick
    ) {
      return;
    }

    // Une potion classique ou élémentaire :
    // première version = utilisation immédiate
    // sur soi-même.
    if (
      card.type === CardType.Potion ||
      card.type === CardType.ElementalPotion
    ) {
      updateGame({
        type: "useCard",
        cardId: card.id,
      });

      return;
    }

    // Les attaques et cartes de voie nécessitent
    // une sélection supplémentaire.
    setSelectedCardId(card.id);
    setSelectedTargetId(null);
    setWizardElement(undefined);
    setPathElement(null);
    setSelectedElementTargetId(null);
  }

  function handleTargetClick(
    targetId: string,
  ) {
    if (!selectedCard) {
      return;
    }

    if (
      selectedCard.type !==
        CardType.Attack &&
      selectedCard.type !==
        CardType.ElementalAttack
    ) {
      return;
    }

    setSelectedTargetId(
      targetId,
    );
  }

  function handleElementTargetClick(
    targetId: string,
  ) {
    setSelectedElementTargetId(targetId);
  }

  function handleUseSelectedAttack() {
    if (!selectedCard) {
      return;
    }

    if (
      selectedCard.type !==
        CardType.Attack &&
      selectedCard.type !==
        CardType.ElementalAttack
    ) {
      return;
    }

    if (!selectedTargetId) {
      return;
    }

    const classPowerOptions: {
      wizardElement?: Element | null;
      shieldBreakTargetId?: string;
    } = {};

    if (wizardElement !== undefined) {
      classPowerOptions.wizardElement =
        wizardElement;
    }

    if (selectedElementTargetId !== null) {
      classPowerOptions.shieldBreakTargetId =
        selectedElementTargetId;
    }

    updateGame({
      type: "useCard",
      cardId: selectedCard.id,
      targetId: selectedTargetId,
      classPowerOptions,
    });
  }

  function handlePlayElementalPath() {
    if (
      !selectedCard ||
      selectedCard.type !==
        CardType.ElementalPath ||
      !pathElement
    ) {
      return;
    }

    updateGame({
      type: "playElementalPath",
      cardId: selectedCard.id,
      element: pathElement,
    });
  }

  const isAttackSelected =
    selectedCard?.type ===
      CardType.Attack ||
    selectedCard?.type ===
      CardType.ElementalAttack;

  const isPathSelected =
    selectedCard?.type ===
    CardType.ElementalPath;

  const needsWizardChoice =
    isAttackSelected &&
    activePlayer?.class === PlayerClass.Wizard &&
    selectedCard !== null &&
    isAssociatedAttackForClass(
      activePlayer.class,
      selectedCard.attack,
    );

  const needsEarthTarget =
    isAttackSelected &&
    (
      activePlayer?.element === Element.Earth ||
      wizardElement === Element.Earth
    );



  return (
    <main className="game-app">
      <header className="game-header">
        <h1>Carabistouilles</h1>

        {isPlaying && activePlayer && (
          <div className="turn-info">
            <strong>
              Tour de{" "}
              {activePlayer.name}
            </strong>

            <span>
              Actions restantes :{" "}
              {game.actionsRemaining}
            </span>
          </div>
        )}
      </header>

      {isWaiting && (
        <section className="start-screen">
          <h2>
            Prêts à jouer ?
          </h2>

          <p>
            Aucun joueur ne commence
            avec des cartes.
          </p>

          <button
            type="button"
            onClick={
              handleStartGame
            }
          >
            Démarrer la partie
          </button>
        </section>
      )}

      {isPlaying &&
        activePlayer && (
          <section className="game-board">
            <section className="players">
              {game.players.map(
                (player) => {
                  const isActive =
                    player.id ===
                    game.currentPlayerId;

                  const isTarget =
                    selectedTargetId ===
                    player.id;

                  return (
                    <article
                      key={player.id}
                      className={
                        isActive
                          ? "player-card active"
                          : "player-card"
                      }
                    >
                      <div className="player-card-header">
                        <h2>
                          {player.name}
                        </h2>

                        {isActive && (
                          <span className="active-label">
                            À vous
                          </span>
                        )}
                      </div>

                      <div className="player-stats">
                        <span>
                          ❤️{" "}
                          {player.hp} PV
                        </span>

                        <span>
                          🛡️{" "}
                          {player.shield} PB
                        </span>
                      </div>

                      <div className="player-class">
                        {player.class}
                      </div>

                      <div className="player-element">
                        Voie :{" "}
                        {player.element ??
                          "aucune"}
                      </div>

                      {isAttackSelected &&
                        player.id !== activePlayer.id &&
                        player.status === PlayerStatus.Alive &&
                        player.hp > 0 && (
                          <button
                            type="button"
                            className={
                              isTarget
                                ? "target-button selected"
                                : "target-button"
                            }
                            onClick={() =>
                              handleTargetClick(
                                player.id,
                              )
                            }
                          >
                            Cibler
                          </button>
                        )}

                      <div className="player-hand-count">
                        Cartes :{" "}
                        {
                          player.hand
                            .length
                        }
                      </div>
                    </article>
                  );
                },
              )}
            </section>

            <section className="action-area">
              <div className="hand-area">
                <h2>
                  Main de{" "}
                  {activePlayer.name}
                </h2>

                {activeHand.length ===
                0 ? (
                  <p>
                    Votre main est
                    vide.
                  </p>
                ) : (
                  <div className="hand">
                    {activeHand.map(
                      (card) => {
                        const isSelected =
                          card.id ===
                          selectedCardId;

                        const disabled =
                          game.actionsRemaining <=
                            0 ||
                          card.type ===
                            CardType.Trick;

                        return (
                          <button
                            key={card.id}
                            type="button"
                            className={
                              isSelected
                                ? "card selected"
                                : "card"
                            }
                            disabled={
                              disabled
                            }
                            onClick={() =>
                              handleCardClick(
                                card,
                              )
                            }
                          >
                            <strong>
                              {card.name}
                            </strong>

                            <span>
                              {getCardLabel(
                                card,
                              )}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              {selectedCard && (
                <section className="card-action-panel">
                  <h2>
                    {selectedCard.name}
                  </h2>

                  {isAttackSelected && (
                    <>
                    <p>
                      Choisissez la cible de l'attaque.
                    </p>

                      {needsWizardChoice && (
                        <div className="choice-group">
                          <strong>
                            Pouvoir du
                            Sorcier
                          </strong>

                          <div className="choice-buttons">
                            {Object.values(
                              Element,
                            ).map(
                              (element) => (
                                <button
                                  key={
                                    element
                                  }
                                  type="button"
                                  className={
                                    wizardElement ===
                                    element
                                      ? "choice-button selected"
                                      : "choice-button"
                                  }
                                  onClick={() =>
                                    setWizardElement(
                                      element,
                                    )
                                  }
                                >
                                  {
                                    elementLabel[
                                      element
                                    ]
                                  }
                                </button>
                              ),
                            )}

                            <button
                              type="button"
                              className={
                                wizardElement ===
                                null
                                  ? "choice-button selected"
                                  : "choice-button"
                              }
                              onClick={() =>
                                setWizardElement(
                                  null,
                                )
                              }
                            >
                              Aucun
                            </button>
                          </div>
                        </div>
                      )}

                      {needsEarthTarget && (
                      <div className="choice-group">
                        <strong>
                          Cible du pouvoir Terre
                        </strong>

                        <div className="choice-buttons">
                          {game.players
                            .filter(
                              (player) =>
                                player.status === PlayerStatus.Alive &&
                                player.hp > 0,
                            )
                            .map((player) => (
                              <button
                                key={player.id}
                                type="button"
                                className={
                                  selectedElementTargetId ===
                                  player.id
                                    ? "choice-button selected"
                                    : "choice-button"
                                }
                                onClick={() =>
                                  handleElementTargetClick(
                                    player.id,
                                  )
                                }
                              >
                                {player.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                      <div className="selected-target">
                        Cible :{" "}
                        {selectedTargetId
                          ? game.players.find(
                              (player) =>
                                player.id ===
                                selectedTargetId,
                            )?.name
                          : "aucune"}
                      </div>

                      <div className="panel-actions">
                        <button
                          type="button"
                          disabled={
                            selectedTargetId === null ||
                            (
                              needsWizardChoice &&
                              wizardElement === undefined
                            ) ||
                            (
                              needsEarthTarget &&
                              selectedElementTargetId === null
                            )
                          }
                          onClick={
                            handleUseSelectedAttack
                          }
                        >
                          Jouer la carte
                        </button>

                        <button
                          type="button"
                          onClick={
                            resetSelection
                          }
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}

                  {isPathSelected && (
                    <>
                      <p>
                        Choisissez votre
                        voie élémentaire.
                      </p>

                      <div className="choice-buttons">
                        {Object.values(
                          Element,
                        ).map(
                          (element) => (
                            <button
                              key={
                                element
                              }
                              type="button"
                              className={
                                pathElement ===
                                element
                                  ? "choice-button selected"
                                  : "choice-button"
                              }
                              onClick={() =>
                                setPathElement(
                                  element,
                                )
                              }
                            >
                              {
                                elementLabel[
                                  element
                                ]
                              }
                            </button>
                          ),
                        )}
                      </div>

                      <div className="panel-actions">
                        <button
                          type="button"
                          disabled={
                            pathElement ===
                            null
                          }
                          onClick={
                            handlePlayElementalPath
                          }
                        >
                          Choisir cette voie
                        </button>

                        <button
                          type="button"
                          onClick={
                            resetSelection
                          }
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                </section>
              )}

              <div className="game-actions">
                <button
                  type="button"
                  disabled={
                    game.actionsRemaining <=
                    0
                  }
                  onClick={() =>
                    updateGame({
                      type: "drawCard",
                    })
                  }
                >
                  Piocher
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateGame({
                      type: "endTurn",
                    })
                  }
                >
                  Fin du tour
                </button>
              </div>
            </section>
          </section>
        )}

      {game.status ===
        "finished" && (
        <section className="finished-screen">
          <h2>
            Partie terminée
          </h2>

          <p>
            Le gagnant est{" "}
            <strong>
              {
                game.players.find(
                  (player) =>
                    player.id ===
                    game.winnerId,
                )?.name
              }
            </strong>
            .
          </p>
        </section>
      )}
    </main>
  );
}

function getCardLabel(
  card: Card,
): string {
  switch (card.type) {
    case CardType.Attack:
      return `Attaque ${card.attack}`;

    case CardType.Potion:
      return `Potion ${card.potion}`;

    case CardType.ElementalAttack:
      return `Attaque élémentaire ${card.attack}`;

    case CardType.ElementalPotion:
      return `Potion élémentaire ${card.potion}`;

    case CardType.ElementalPath:
      return "Voie élémentaire";

    case CardType.Trick:
      return "Carabistouille";
  }
}

const elementLabel: Record<
  Element,
  string
> = {
  [Element.Fire]: "Feu",
  [Element.Water]: "Eau",
  [Element.Earth]: "Terre",
  [Element.Air]: "Air",
};

export default App;