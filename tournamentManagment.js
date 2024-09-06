import { getPlayers } from "./players.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  writeBatch,
  query,
  where,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

let allPlayers = [];
let currentInputId = null;

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.db = db;

// Main setup function
function setup() {
  setupCuartosButton();
  setupPlayerInputs();
  setupSearchInput();
  displayActiveTournamentName();
}

export async function activarApuestas() {
  const tournamentId = await getActiveTournamentId();
  const db = window.db;

  if (!tournamentId) {
    console.error("No active tournament found.");
    alert("No active tournament found.");
    return;
  }

  try {
    const tournamentDocRef = doc(db, "I_Torneos", tournamentId);

    // Set the apuestas field to 1
    await updateDoc(tournamentDocRef, {
      apuestas: 1,
    });

    console.log("Apuestas activated successfully.");
    alert("Apuestas activated successfully.");
  } catch (error) {
    console.error("Error activating apuestas: ", error);
    alert("Error activating apuestas.");
  }
}

// Function to deactivate bets
export async function desactivarApuestas() {
  const tournamentId = await getActiveTournamentId();
  const db = window.db;

  if (!tournamentId) {
    console.error("No active tournament found.");
    alert("No active tournament found.");
    return;
  }

  try {
    const tournamentRef = doc(db, "I_Torneos", tournamentId);
    await updateDoc(tournamentRef, {
      apuestas: 0,
    });

    console.log("Apuestas Desactivated successfully.");
    alert("Apuestas Desactivated successfully.");
  } catch (error) {
    console.error("Error Desactivating apuestas: ", error);
    alert("Error Desactivating apuestas.");
  }
}

export async function activateBracketButton(Bracket) {
  const tournamentId = await getActiveTournamentId();
  const db = window.db;

  if (!tournamentId) {
    console.error("No active tournament found.");
    alert("No active tournament found.");
    return;
  }

  try {
    const tournamentDocRef = doc(db, "I_Torneos", tournamentId);

    switch (Bracket) {
      case "cuartos":
      case "semis":
      case "finales":
      case "":
        await updateDoc(tournamentDocRef, {
          active_bracket: Bracket, // This will be either cuartos, semis, finales, or an empty string
        });
        console.log(`Bracket set to ${Bracket}`);
        alert(`Bracket activated: ${Bracket}`);
        break;
      default:
        console.error("Invalid bracket value.");
        alert("Invalid bracket value.");
        break;
    }
  } catch (error) {
    console.error("Error updating bracket: ", error);
    alert("Error updating bracket.");
  }
}

function setupCuartosButton() {
  const loadCuartosButton = document.getElementById("cuartos_finishButton");
  if (loadCuartosButton) {
    loadCuartosButton.addEventListener("click", handleCuartosButtonClick);
  }
}

function setupPlayerInputs() {
  const playerInputs = document.querySelectorAll('[id^="cuartos_player"]');
  if (playerInputs.length > 0) {
    playerInputs.forEach((input) => {
      input.addEventListener("click", (event) => {
        currentInputId = event.target.id;
        openPlayersModal();
      });
    });
  } else {
    console.log(
      "No player inputs found with IDs starting with 'cuartos_player'."
    );
  }
}

function setupSearchInput() {
  const searchPlayerInput = document.getElementById("searchPlayerInput");
  if (searchPlayerInput) {
    searchPlayerInput.addEventListener("input", filterPlayers);
  } else {
    console.log("Element with ID 'searchPlayerInput' not found.");
  }
}

async function handleCuartosButtonClick() {
  const player1 = document.getElementById("cuartos_player1").value;
  const player2 = document.getElementById("cuartos_player2").value;
  const player3 = document.getElementById("cuartos_player3").value;
  const player4 = document.getElementById("cuartos_player4").value;
  const player5 = document.getElementById("cuartos_player5").value;
  const player6 = document.getElementById("cuartos_player6").value;
  const player7 = document.getElementById("cuartos_player7").value;
  const player8 = document.getElementById("cuartos_player8").value;

  if (
    !player1 ||
    !player2 ||
    !player3 ||
    !player4 ||
    !player5 ||
    !player6 ||
    !player7 ||
    !player8
  ) {
    alert("All fields are required!");
    return;
  }

  const tournamentId = await getActiveTournamentId();
  const players = [
    player1,
    player2,
    player3,
    player4,
    player5,
    player6,
    player7,
    player8,
  ];
  const db = window.db;
  const batch = writeBatch(db);

  for (let i = 0; i < players.length; i++) {
    const playerName = players[i];
    const playerQuery = query(
      collection(db, "I_Torneos", tournamentId, "I_Players"),
      where("name", "==", playerName)
    );
    const playerSnapshot = await getDocs(playerQuery);

    if (!playerSnapshot.empty) {
      const playerDoc = playerSnapshot.docs[0];
      const playerData = playerDoc.data();
      const playerId = playerData.id_player;

      const cuartosQuery = query(
        collection(db, "I_Torneos", tournamentId, "I_Cuartos"),
        where("orden", "==", i + 1)
      );
      const cuartosSnapshot = await getDocs(cuartosQuery);

      if (!cuartosSnapshot.empty) {
        const cuartosDoc = cuartosSnapshot.docs[0];
        const cuartosDocRef = doc(
          db,
          "I_Torneos",
          tournamentId,
          "I_Cuartos",
          cuartosDoc.id
        );

        batch.update(cuartosDocRef, {
          name: playerName,
          id_player: playerId,
        });
      } else {
        console.error(`No document found in I_Cuartos with order ${i + 1}`);
      }
    } else {
      console.error(`Player ${playerName} not found in I_Players collection`);
      alert(`Player ${playerName} not found in I_Players collection`);
      return;
    }
  }

  await batch.commit();
  console.log("Players updated in I_Cuartos collection");

  //await processClasificacionCuartos(tournamentId);
}

// async function processClasificacionCuartos(tournamentId) {
//   const db = window.db;

//   // Fetch all players in I_Cuartos
//   console.log("Fetching players from I_Cuartos...");
//   const cuartosCollection = collection(
//     db,
//     "I_Torneos",
//     tournamentId,
//     "I_Cuartos"
//   );
//   const cuartosSnapshot = await getDocs(cuartosCollection);
//   const cuartosPlayers = cuartosSnapshot.docs.map(
//     (doc) => doc.data().id_player
//   );

//   // Fetch all users in I_Apuestas
//   console.log("Fetching all users from I_Apuestas...");
//   const apuestasCollection = collection(
//     db,
//     "I_Torneos",
//     tournamentId,
//     "I_Apuestas"
//   );
//   const apuestasSnapshot = await getDocs(apuestasCollection);

//   // Prepare the I_Clasificacion_Cuartos collection
//   const clasificacionCollection = collection(
//     db,
//     "I_Torneos",
//     tournamentId,
//     "I_Clasificacion_Cuartos"
//   );
//   const batch = writeBatch(db);

//   for (const apuestaDoc of apuestasSnapshot.docs) {
//     const apuestaData = apuestaDoc.data();
//     const matchingPlayers = [];

//     // Fetch the user's name
//     const userName = await getUserNameById(apuestaDoc.id);

//     // Check how many of the players in this user's bet are in I_Cuartos
//     for (let i = 1; i <= 8; i++) {
//       const playerId = apuestaData[`player${i}`];

//       if (cuartosPlayers.includes(playerId)) {
//         // Fetch the player's name
//         const playerName = await getPlayerNameById(playerId, tournamentId);

//         matchingPlayers.push({ playerId, playerName });
//       }
//     }

//     // If there are at least two matching players, add them to I_Clasificacion_Cuartos
//     if (matchingPlayers.length >= 2) {
//       const clasificacionDocRef = doc(clasificacionCollection, apuestaDoc.id); // Using userId as the document ID
//       batch.set(clasificacionDocRef, {
//         userId: apuestaDoc.id,
//         userName: userName,
//         players: matchingPlayers, // Array of objects with playerId and playerName
//       });
//     } else {
//     }
//   }

//   // Commit the batch operation

//   await batch.commit();
// }

const getUserNameById = async (userId) => {
  const userDocRef = doc(db, "I_Members", userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data().firstName + " " + userDoc.data().lastName;
  } else {
    console.error(`No user found with ID: ${userId}`);
    return "Unknown User";
  }
};

const getPlayerNameById = async (playerId, tournamentId) => {
  const db = window.db;
  const playerQuery = query(
    collection(db, "I_Torneos", tournamentId, "I_Players"),
    where("id_player", "==", playerId)
  );
  const playerSnapshot = await getDocs(playerQuery);

  if (!playerSnapshot.empty) {
    return playerSnapshot.docs[0].data().name;
  } else {
    return null;
  }
};

async function getActiveTournamentId() {
  const db = window.db;
  const q = query(collection(db, "I_Torneos"), where("activo", "==", 1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  } else {
    return;
  }
}

async function displayActiveTournamentName() {
  const db = window.db;
  const q = query(collection(db, "I_Torneos"), where("activo", "==", 1));
  const querySnapshot = await getDocs(q);

  const tournamentNameElement = document.getElementById("tournamentName");
  console.log("Tournament name element:", tournamentNameElement);

  if (tournamentNameElement) {
    if (!querySnapshot.empty) {
      const activeTournament = querySnapshot.docs[0].data();
      tournamentNameElement.innerText = activeTournament.name;
    } else {
      tournamentNameElement.innerText = "No active tournament found";
    }
  } else {
    console.error("Element with ID 'tournamentName' not found.");
  }
}

async function openPlayersModal() {
  allPlayers = await getPlayers();
  allPlayers.sort((a, b) => a.name.localeCompare(b.name));
  displayPlayers(allPlayers);
  document.getElementById("modalPlayers").style.display = "block";
}

function displayPlayers(players) {
  const playersList = document.getElementById("playersList");
  playersList.innerHTML = "";
  players.forEach((player) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${player.name}`;
    listItem.addEventListener("click", () => selectPlayer(player.name));
    playersList.appendChild(listItem);
  });
}

function filterPlayers() {
  const searchQuery = document
    .getElementById("searchPlayerInput")
    .value.toLowerCase();
  const filteredPlayers = allPlayers.filter((player) =>
    player.name.toLowerCase().includes(searchQuery)
  );
  displayPlayers(filteredPlayers);
}

function selectPlayer(playerName) {
  if (currentInputId) {
    document.getElementById(currentInputId).value = playerName;
  }
  closePlayersModal();
}

function closePlayersModal() {
  document.getElementById("modalPlayers").style.display = "none";
}

// Run setup when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}
