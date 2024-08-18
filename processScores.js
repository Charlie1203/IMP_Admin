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
  return; // Retorna el objeto con los valores
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
        await processMatches(
          scores,
          tournamentId,
          collectionName,
          playerNumber
        );
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

async function processMatches(
  scores,
  tournamentId,
  collectionName,
  playerNumber1
) {
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

      const result = await compareScores(scoreSheet1, scoreSheet2);
      console.log(result);
      //TODO: Update the result in the database
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
// DONE??
const compareScores = async (scoreSheet1, scoreSheet2) => {
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
        return 4;
      case 2:
        return 3;
      case 3:
        return 2;
      case 4:
        return 1;
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
