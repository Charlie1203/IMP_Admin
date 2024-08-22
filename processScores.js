import {
  doc,
  setDoc,
  collection,
  writeBatch,
  query,
  where,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

const getActiveTournamentId = async () => {
  const db = window.db;
  const q = query(collection(db, "I_Torneos"), where("activo", "==", 1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  } else {
    return;
  }
};

export async function collectScores(playerNumber) {
  // Selecciona todos los inputs de puntuación
  const inputs = document.querySelectorAll(".score-input");

  // Objeto para almacenar los valores
  const scores = {};

  // Recorre todos los inputs y los guarda en el objeto
  inputs.forEach((input, index) => {
    // Asigna el valor del input al objeto usando el número del hoyo como clave
    scores[`hoyo${index + 1}`] = input.value.trim();
  });

  let collectionName = determineCollectionName();
  let tournamentID = await getActiveTournamentId();

  storeScores(scores, tournamentID, collectionName, playerNumber);
  return;
}

async function storeScores(scores, tournamentId, collectionName, playerNumber) {
  if (tournamentId != null && collectionName != null) {
    if (playerNumber === undefined) {
      console.log("Player number is undefined.");
      return;
    }

    try {
      const colRef = collection(db, "I_Torneos", tournamentId, collectionName);

      const q = query(colRef, where("orden", "==", playerNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;

        const scoreFields = {};
        for (let i = 1; i <= 18; i++) {
          const holeNumber = i.toString().padStart(2, "0");
          scoreFields[`H${holeNumber}`] = Number(scores[`hoyo${i}`]);
        }
        await updateDoc(docRef, scoreFields);
        console.log("Scores updated successfully.");
        await processMatches(tournamentId, collectionName, playerNumber);
        return;
      } else {
        console.log("No document found with the given player number.");
      }
    } catch (error) {
      console.error("Error updating scores: ", error);
    }
  } else {
    console.log("Tournament ID or collection name are null");
  }
}

async function processMatches(tournamentId, collectionName, playerNumber1) {
  if (tournamentId != null && collectionName != null && playerNumber1 != null) {
    const playerNumber2 = await getOpponentNumber(
      collectionName,
      playerNumber1
    );
    if (playerNumber2 != null) {
      const scoreSheet1 = await fetchScoreSheet(
        tournamentId,
        collectionName,
        playerNumber1
      );
      const scoreSheet2 = await fetchScoreSheet(
        tournamentId,
        collectionName,
        playerNumber2
      );

      const result = await compareScores(
        scoreSheet1,
        scoreSheet2,
        playerNumber1,
        playerNumber2
      );

      if (result.stillPlaying === true) {
        return;
      }

      await processPlayers(
        result,
        tournamentId,
        collectionName,
        playerNumber1,
        playerNumber2
      );
    } else {
      console.log("Error getting opponent number");
    }
  } else {
    console.log("Tournament ID or collection name or playerNumber are null");
  }
}

// DONE
function determineCollectionName() {
  const path = document.location.pathname;

  if (path.includes("quarterFinals.html")) {
    return "I_Cuartos";
  } else if (path.includes("semiFinals.html")) {
    return "I_Semifinales";
  } else if (path.includes("finales.html")) {
    return "I_Finales";
  } else if (path.includes("tercerCuarto.html")) {
    return "I_TercerCuarto";
  } else {
    return null;
  }
}

// DONE
async function fetchScoreSheet(tournamentId, collectionName, playerNumber) {
  if (tournamentId != null && collectionName != null && playerNumber != null) {
    try {
      const collectionReference = collection(
        db,
        "I_Torneos",
        tournamentId,
        collectionName
      );

      const q = query(collectionReference, where("orden", "==", playerNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const scores = {};

        const doc = querySnapshot.docs[0];

        for (let i = 1; i <= 18; i++) {
          const holeNumber = i.toString().padStart(2, "0");
          scores[`H${i}`] = doc.data()[`H${holeNumber}`];
        }

        return scores;
      } else {
        console.log("No document found with the given player number.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching score sheet:", error);
      return null;
    }
  } else {
    console.log("Tournament ID or collection name or playerNumber are null");
    return null;
  }
}
// DONE
const compareScores = async (
  scoreSheet1,
  scoreSheet2,
  playerNumber1,
  playerNumber2
) => {
  let score = {
    currentHole: 1,
    holesPlayed: 0,
    holesRemaining: 18,
    result: 0,
    stillPlaying: true,
  };

  if (scoreSheet1 === null || scoreSheet2 === null) {
    return null;
  }

  while (score.currentHole <= 18) {
    const score1 = scoreSheet1[`H${score.currentHole}`];
    const score2 = scoreSheet2[`H${score.currentHole}`];

    if (score1 === 0 || score2 === 0) {
      score.currentHole++;
      continue;
    }

    if (score1 === score2) {
      score.holesPlayed++;
      score.holesRemaining--;
      score.currentHole++;
      continue;
    }

    if (score1 < score2) {
      score.result--;
      score.holesPlayed++;
      score.holesRemaining--;
      score.currentHole++;
      continue;
    }
    if (score1 > score2) {
      score.result++;
      score.holesPlayed++;
      score.holesRemaining--;
      score.currentHole++;
      continue;
    }

    score.currentHole++;
  }

  if (score.holesPlayed === 18) {
    score.stillPlaying = false;
  }

  if (score.result === 0 && score.stillPlaying === false) {
    for (let i = 1; i <= 18; i++) {
      const score1 = scoreSheet1[`H${i}`];
      const score2 = scoreSheet2[`H${i}`];

      if (score1 < score2) {
        score.result--;
        break;
      }
      if (score1 > score2) {
        score.result++;
        break;
      }
    }
  }

  if (score.result === 0 && score.stillPlaying === false) {
    if (playerNumber1 < playerNumber2) {
      score.result = -1;
    } else {
      score.result = 1;
    }
  }
  return score;
};

// DONE
async function getOpponentNumber(collectionName, playerNumber) {
  if (collectionName === "I_Cuartos") {
    switch (playerNumber) {
      case 1:
        return 8;
      case 2:
        return 7;
      case 3:
        return 6;
      case 4:
        return 5;
      case 5:
        return 4;
      case 6:
        return 3;
      case 7:
        return 2;
      case 8:
        return 1;
      default:
        return null;
    }
  } else if (collectionName === "I_Semifinales") {
    switch (playerNumber) {
      case 1:
        return 2;
      case 2:
        return 1;
      case 3:
        return 4;
      case 4:
        return 3;
      default:
        return null;
    }
  } else {
    switch (playerNumber) {
      case 1:
        return 2;
      case 2:
        return 1;
      default:
        return null;
    }
  }
}

//DONE
async function getNextPlayerOrder(
  playerNumber1,
  playerNumber2,
  collectionName
) {
  if (collectionName === "I_Cuartos") {
    if (
      playerNumber1 === 1 ||
      playerNumber1 === 8 ||
      playerNumber2 === 1 ||
      playerNumber2 === 8
    ) {
      return 1;
    } else if (
      playerNumber1 === 2 ||
      playerNumber1 === 7 ||
      playerNumber2 === 2 ||
      playerNumber2 === 7
    ) {
      return 3;
    } else if (
      playerNumber1 === 3 ||
      playerNumber1 === 6 ||
      playerNumber2 === 3 ||
      playerNumber2 === 6
    ) {
      return 4;
    } else if (
      playerNumber1 === 4 ||
      playerNumber1 === 5 ||
      playerNumber2 === 4 ||
      playerNumber2 === 5
    ) {
      return 2;
    }
  } else if (collectionName === "I_Semifinales") {
    if (
      playerNumber1 === 1 ||
      playerNumber1 === 2 ||
      playerNumber2 === 2 ||
      playerNumber2 === 1
    ) {
      return 1;
    } else if (
      playerNumber1 === 4 ||
      playerNumber1 === 3 ||
      playerNumber2 === 3 ||
      playerNumber2 === 4
    ) {
      return 2;
    }
  } else if (
    collectionName === "I_Finales" ||
    collectionName === "I_TercerCuarto"
  ) {
    if (playerNumber1 === 1) {
      return 1;
    } else if (playerNumber1 === 2) {
      return 2;
    }
  }
}

async function processPlayers(
  score,
  tournamentId,
  collectionName,
  playerNumber1,
  playerNumber2
) {
  let nextPlayerOrder;
  let currentOrder;
  let winnerOrder;
  let looserOrder;
  switch (collectionName) {
    case "I_Cuartos":
      nextPlayerOrder = await getNextPlayerOrder(
        playerNumber1,
        playerNumber2,
        collectionName
      );
      currentOrder = score.result < 1 ? playerNumber1 : playerNumber2;
      await processQuarterFinals(
        score,
        tournamentId,
        collectionName,
        currentOrder,
        nextPlayerOrder
      );
      break;
    case "I_Semifinales":
      nextPlayerOrder = await getNextPlayerOrder(
        playerNumber1,
        playerNumber2,
        collectionName
      );
      winnerOrder = score.result < 1 ? playerNumber1 : playerNumber2;
      looserOrder =
        winnerOrder === playerNumber1 ? playerNumber2 : playerNumber1;
      await processSemiFinals(
        score,
        tournamentId,
        collectionName,
        nextPlayerOrder,
        winnerOrder,
        looserOrder
      );
      break;

    case "I_Finales":
      winnerOrder = score.result < 1 ? playerNumber1 : playerNumber2;
      looserOrder =
        winnerOrder === playerNumber1 ? playerNumber2 : playerNumber1;
      await processFinals(
        score,
        tournamentId,
        collectionName,
        winnerOrder,
        looserOrder
      );
      break;
    case "I_TercerCuarto":
      winnerOrder = score.result < 1 ? playerNumber1 : playerNumber2;
      looserOrder =
        winnerOrder === playerNumber1 ? playerNumber2 : playerNumber1;
      await processThirdPlace(
        score,
        tournamentId,
        collectionName,
        winnerOrder,
        looserOrder
      );
      break;
    default:
      console.log("Collection name not recognized.");
  }
}

async function processQuarterFinals(
  score,
  tournamentId,
  collectionName,
  currentOrder,
  nextPlayerOrder
) {
  if (score === null) {
    console.log("Score is null.");
    return;
  }

  if (score.stillPlaying === true) {
    console.log("Function called when players are still playing");
    return;
  }

  const db = window.db;

  try {
    const cuartosQuery = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", currentOrder)
    );

    const cuartosSnapshot = await getDocs(cuartosQuery);

    if (cuartosSnapshot.empty) {
      console.log(
        "No document found in ${collectionName} with the specified orden"
      );
      return;
    }

    const cuartosDoc = cuartosSnapshot.docs[0];
    const { name, id_player } = cuartosDoc.data();

    const semisQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Semifinales"),
      where("orden", "==", nextPlayerOrder)
    );

    const semisSnapshot = await getDocs(semisQuery);

    if (semisSnapshot.empty) {
      console.log(
        "No document found in I_Semifinales with the specified orden"
      );
      return;
    }

    const semisDocRef = semisSnapshot.docs[0].ref;

    await updateDoc(semisDocRef, {
      name: name,
      id_player: id_player,
    });

    console.log(
      `Updated I_Semifinales document with orden ${nextPlayerOrder} with player name ${name} and id_player ${id_player}`
    );
  } catch (error) {
    console.error("Error processing quarter finals:", error);
  }
}

async function processSemiFinals(
  score,
  tournamentId,
  collectionName,
  nextPlayerOrder,
  winnerOrder,
  looserOrder
) {
  if (score === null) {
    console.log("Error processing players, score is null.");
    return;
  }

  if (score.stillPlaying === true) {
    console.log("Function called when players are still playing");
    return;
  }

  const db = window.db;

  try {
    const semisQueryWinner = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", winnerOrder)
    );

    const semisQueryLooser = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", looserOrder)
    );

    const semisSnapshotWinner = await getDocs(semisQueryWinner);
    const semisSnapshotLooser = await getDocs(semisQueryLooser);

    if (semisSnapshotWinner.empty || semisSnapshotLooser.empty) {
      console.log(
        `No document found in ${collectionName} with the specified orden`
      );
      return;
    }

    const winnerDoc = semisSnapshotWinner.docs[0];
    const loserDoc = semisSnapshotLooser.docs[0];

    const winnerData = winnerDoc.data();
    const loserData = loserDoc.data();

    const finalsQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Finales"),
      where("orden", "==", nextPlayerOrder)
    );

    const finalsSnapshot = await getDocs(finalsQuery);

    if (finalsSnapshot.empty) {
      console.log(
        `No document found in I_Finales with orden ${nextPlayerOrder}`
      );
      return;
    }

    const finalsDocRef = finalsSnapshot.docs[0].ref;

    await updateDoc(finalsDocRef, {
      name: winnerData.name,
      id_player: winnerData.id_player,
    });

    console.log(
      `Updated I_Finales document with orden ${nextPlayerOrder} with player name ${winnerData.name} and id_player ${winnerData.id_player}`
    );

    const tercerCuartoQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_TercerCuarto"),
      where("orden", "==", nextPlayerOrder)
    );

    const tercerCuartoSnapshot = await getDocs(tercerCuartoQuery);

    if (tercerCuartoSnapshot.empty) {
      console.log(
        `No document found in I_TercerCuarto with orden ${nextPlayerOrder}`
      );
      return;
    }

    const tercerCuartoDocRef = tercerCuartoSnapshot.docs[0].ref;

    await updateDoc(tercerCuartoDocRef, {
      name: loserData.name,
      id_player: loserData.id_player,
    });

    console.log(
      `Updated I_TercerCuarto document with orden ${nextPlayerOrder} with player name ${loserData.name} and id_player ${loserData.id_player}`
    );
  } catch (error) {
    console.error("Error processing semifinals:", error);
  }
}

async function processFinals(
  score,
  tournamentId,
  collectionName,
  winnerOrder,
  looserOrder
) {
  if (score === null) {
    console.log("Error processing players, score is null.");
    return;
  }

  if (score.stillPlaying === true) {
    console.log("Function called when players are still playing");
    return;
  }

  const db = window.db;

  try {
    const winnerQuery = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", winnerOrder)
    );
    const winnerSnapshot = await getDocs(winnerQuery);

    if (winnerSnapshot.empty) {
      console.log(
        `No document found in ${collectionName} with orden ${winnerOrder}`
      );
      return;
    }

    const winnerDoc = winnerSnapshot.docs[0];
    const winnerData = winnerDoc.data();

    // Fetch the loser's document from the specified collection
    const looserQuery = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", looserOrder)
    );
    const looserSnapshot = await getDocs(looserQuery);

    if (looserSnapshot.empty) {
      console.log(
        `No document found in ${collectionName} with orden ${looserOrder}`
      );
      return;
    }

    const looserDoc = looserSnapshot.docs[0];
    const looserData = looserDoc.data();

    // Update the document in I_Resultados where orden == 1 (Winner)
    const winnerResultQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Resultados"),
      where("orden", "==", 1)
    );
    const winnerResultSnapshot = await getDocs(winnerResultQuery);

    if (winnerResultSnapshot.empty) {
      console.log("No document found in I_Resultados with orden 1");
      return;
    }

    const winnerResultDocRef = winnerResultSnapshot.docs[0].ref;
    await updateDoc(winnerResultDocRef, {
      name: winnerData.name,
      id_player: winnerData.id_player,
    });

    console.log(
      `Updated I_Resultados document with orden 1 with player name ${winnerData.name} and id_player ${winnerData.id_player}`
    );

    // Update the document in I_Resultados where orden == 2 (Loser)
    const looserResultQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Resultados"),
      where("orden", "==", 2)
    );
    const looserResultSnapshot = await getDocs(looserResultQuery);

    if (looserResultSnapshot.empty) {
      console.log("No document found in I_Resultados with orden 2");
      return;
    }

    const looserResultDocRef = looserResultSnapshot.docs[0].ref;
    await updateDoc(looserResultDocRef, {
      name: looserData.name,
      id_player: looserData.id_player,
    });

    console.log(
      `Updated I_Resultados document with orden 2 with player name ${looserData.name} and id_player ${looserData.id_player}`
    );
  } catch (error) {
    console.error("Error processing finals:", error);
  }
}

async function processThirdPlace(
  score,
  tournamentId,
  collectionName,
  winnerOrder,
  looserOrder
) {
  if (score === null) {
    console.log("Error processing players, score is null.");
    return;
  }

  if (score.stillPlaying === true) {
    console.log("Function called when players are still playing");
    return;
  }

  const db = window.db;

  try {
    // Fetch the winner's document from the specified collection
    const winnerQuery = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", winnerOrder)
    );
    const winnerSnapshot = await getDocs(winnerQuery);

    if (winnerSnapshot.empty) {
      console.log(
        `No document found in ${collectionName} with orden ${winnerOrder}`
      );
      return;
    }

    const winnerDoc = winnerSnapshot.docs[0];
    const winnerData = winnerDoc.data();

    // Fetch the loser's document from the specified collection
    const looserQuery = query(
      collection(db, "I_Torneos", tournamentId, collectionName),
      where("orden", "==", looserOrder)
    );
    const looserSnapshot = await getDocs(looserQuery);

    if (looserSnapshot.empty) {
      console.log(
        `No document found in ${collectionName} with orden ${looserOrder}`
      );
      return;
    }

    const looserDoc = looserSnapshot.docs[0];
    const looserData = looserDoc.data();

    // Update the document in I_Resultados where orden == 3 (Winner)
    const winnerResultQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Resultados"),
      where("orden", "==", 3)
    );
    const winnerResultSnapshot = await getDocs(winnerResultQuery);

    if (winnerResultSnapshot.empty) {
      console.log("No document found in I_Resultados with orden 3");
      return;
    }

    const winnerResultDocRef = winnerResultSnapshot.docs[0].ref;
    await updateDoc(winnerResultDocRef, {
      name: winnerData.name,
      id_player: winnerData.id_player,
    });

    console.log(
      `Updated I_Resultados document with orden 3 with player name ${winnerData.name} and id_player ${winnerData.id_player}`
    );

    // Update the document in I_Resultados where orden == 4 (Loser)
    const looserResultQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Resultados"),
      where("orden", "==", 4)
    );
    const looserResultSnapshot = await getDocs(looserResultQuery);

    if (looserResultSnapshot.empty) {
      console.log("No document found in I_Resultados with orden 4");
      return;
    }

    const looserResultDocRef = looserResultSnapshot.docs[0].ref;
    await updateDoc(looserResultDocRef, {
      name: looserData.name,
      id_player: looserData.id_player,
    });

    console.log(
      `Updated I_Resultados document with orden 4 with player name ${looserData.name} and id_player ${looserData.id_player}`
    );
  } catch (error) {
    console.error("Error processing Tercer Cuarto:", error);
  }
}
