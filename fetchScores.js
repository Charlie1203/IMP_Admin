import {
  doc,
  setDoc,
  collection,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getPlayers } from "./players.js"; // Assuming getPlayers is exported from players.js
import { v4 as uuidv4 } from "https://jspm.dev/uuid"; // Import UUID function

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

export async function fetchScoresForPlayer(playerNumber, inputs) {
  console.log("Called with playerNumber", playerNumber);

  // Determine the collection based on the HTML page
  let collectionName = determineCollectionName();
  const tournamentId = await getActiveTournamentId();

  if (!collectionName) {
    console.error("Could not determine collection name");
    return;
  }

  const collectionRef = collection(
    db,
    "I_Torneos",
    tournamentId,
    collectionName
  );
  const q = query(collectionRef);
  const docSnap = await getDocs(q);

  if (!docSnap.empty) {
    const playerDoc = docSnap.docs.find(
      (doc) => doc.data().orden === playerNumber
    );

    if (playerDoc) {
      const data = playerDoc.data();

      // Populate the input fields with the scores
      inputs.forEach((input, index) => {
        const holeNumber = (index + 1).toString().padStart(2, "0"); // Hole numbers H01, H02, ... H18
        input.value = data[`H${holeNumber}`] ?? ""; // Set input value or empty string if not present
      });
    } else {
      console.log(playerNumber);
      console.error("Player not found with the specified orden");
    }
  } else {
    console.error("No documents found in the collection!");
  }
}

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
