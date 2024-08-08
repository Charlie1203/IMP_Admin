import {
  doc,
  setDoc,
  collection,
  writeBatch,
  query,
  where,
  getDocs,
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

/**
 * Fetches player names from the "I_Cuartos" collection in Firestore.
 * Assumes there are 8 documents in the collection, each with a "name" and "order" field.
 *
 * @returns {Promise<string[]>} - A promise that resolves to an array of player names sorted by order.
 */
document.addEventListener("DOMContentLoaded", function () {
  fetchAndPopulatePlayers();
});
async function fetchAndPopulatePlayers() {
  const tournamentId = await getActiveTournamentId();
  const db = window.db;
  let collectionName;

  const path = document.location.pathname;
  if (path.includes("quarterFinals.html")) {
    console.log("Called from quarterFinals.html");
    collectionName = "I_Cuartos";
  } else if (path.includes("semiFinals.html")) {
    collectionName = "I_Semifinales";
  } else if (path.includes("finales.html")) {
    collectionName = "I_Finales";
  } else {
    // TODO FIX CORRECT HTML FILE NAMES FOR THIS, FINAL ELSE SHOULD CATCH EDGE CASE
    collectionName = "I_TercerCuarto";
  }

  const cuartosRef = collection(db, "I_Torneos", tournamentId, collectionName);
  const cuartosSnapshot = await getDocs(cuartosRef);

  if (!cuartosSnapshot.empty) {
    const playerDocs = cuartosSnapshot.docs.map((doc) => doc.data());
    playerDocs.sort((a, b) => a.order - b.order);
    const playerNames = playerDocs.map((doc) => doc.name);
    if (playerNames.length <= 8 || playerNames.length >= 2) {
      for (let i = 0; i < playerNames.length; i++) {
        // If any player is set to be an empty string, then the bracket is not ready
        if (playerNames[i] == "") {
          return;
        }
      }
      populatePlayerButtons(playerNames);
    } else {
      console.error(
        "Expected Between 2 and 8 players, but found a different number."
      );
    }
  } else {
    console.error("No players found in the ", collectionName, " collection.");
  }
}

/**
 * Populates the player buttons with the fetched player names.
 *
 * @param {string[]} playerNames - An array of player names.
 */
function populatePlayerButtons(playerNames) {
  console.log(playerNames);
  for (let i = 0; i < playerNames.length; i++) {
    const button = document.getElementById(`player_${i + 1}`);
    if (button) {
      button.textContent = playerNames[i];
    }
  }
}
