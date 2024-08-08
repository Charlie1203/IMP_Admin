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
  console.log("HOLA");
  const tournamentId = await getActiveTournamentId();
  const db = window.db;
  const cuartosRef = collection(db, "I_Torneos", tournamentId, "I_Cuartos");
  const cuartosSnapshot = await getDocs(cuartosRef);

  if (!cuartosSnapshot.empty) {
    const playerDocs = cuartosSnapshot.docs.map((doc) => doc.data());
    playerDocs.sort((a, b) => a.order - b.order);
    const playerNames = playerDocs.map((doc) => doc.name);
    if (playerNames.length === 8) {
      populatePlayerButtons(playerNames);
    } else {
      console.error("Expected 8 players, but found a different number.");
    }
  } else {
    console.error("No players found in the I_Cuartos collection.");
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
