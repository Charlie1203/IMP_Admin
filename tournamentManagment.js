// index.js

import {
  doc,
  setDoc,
  collection,
  writeBatch,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const loadCuartosButton = document.getElementById("cuartos_finishButton");

  /**
   * Event listener for the "click" event on a button.
   * This function retrieves player names from input fields, validates them,
   * and updates the "I_Cuartos" collection in Firestore with the player information.
   * @param {Event} event - The event object.
   */
  loadCuartosButton.addEventListener("click", async () => {
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

        // Find the correct document in I_Cuartos by order
        const cuartosQuery = query(
          collection(db, "I_Torneos", tournamentId, "I_Cuartos"),
          where("order", "==", i + 1)
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
  });

  const loadSemisButton = document.getElementById("semis_finishButton");
  /**
   * Event listener for the "click" event on a button.
   * This function retrieves player names from input fields, validates them,
   * and updates the "I_Semifinales" collection in Firestore with the player information.
   * @param {Event} event - The event object.
   */
  loadSemisButton.addEventListener("click", async () => {
    const player1 = document.getElementById("semis_player1").value;
    const player2 = document.getElementById("semis_player2").value;
    const player3 = document.getElementById("semis_player3").value;
    const player4 = document.getElementById("semis_player4").value;

    if (!player1 || !player2 || !player3 || !player4) {
      alert("All fields are required!");
      return;
    }
    const tournamentId = await getActiveTournamentId();
    const players = [player1, player2, player3, player4];
    const db = window.db;
    const batch = writeBatch(db);

    for (let i = 0; i < players.length; i++) {
      playerName = players[i];
      const playerQuery = query(
        collection(db, "I_Torneos", tournamentId, "I_Players"),
        where("name", "==", playerName)
      );
      const playerSnapshot = await getDocs(playerQuery);

      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        const playerData = playerDoc.data();
        const playerId = playerData.id_player;

        // Find the correct document in I_Cuartos by order
        const semisQuery = query(
          collection(db, "I_Torneos", tournamentId, "I_Semifinales"),
          where("order", "==", i + 1)
        );
        const semisSnapshot = await getDocs(semisQuery);

        if (!semisSnapshot.empty) {
          const semisDoc = semisSnapshot.docs[0];
          const semisDocRef = doc(
            db,
            "I_Torneos",
            tournamentId,
            "I_Semifinales",
            semisDoc.id
          );

          batch.update(semisDocRef, {
            name: playerName,
            id_player: playerId,
          });
        } else {
          console.error(
            `No document found in I_Semifinales with order ${i + 1}`
          );
        }
      } else {
        console.error(`Player ${playerName} not found in I_Players collection`);
        alert(`Player ${playerName} not found in I_Players collection`);
        return;
      }
    }

    await batch.commit();
    console.log("Players updated in I_Semifinales collection");
  });

  const loadFinalButton = document.getElementById("finales_finishButton");
  /**
   * Event listener for the "click" event on a button.
   * This function retrieves player names from input fields, validates them,
   * and updates the "I_Finales" collection in Firestore with the player information.
   * @param {Event} event - The event object.
   */
  loadFinalButton.addEventListener("click", async () => {
    const player1 = document.getElementById("final_player1").value;
    const player2 = document.getElementById("final_player2").value;

    if (!player1 || !player2) {
      alert("All fields are required!");
      return;
    }
    const tournamentId = await getActiveTournamentId();
    const players = [player1, player2];
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

        // Find the correct document in I_Cuartos by order
        const finalQuery = query(
          collection(db, "I_Torneos", tournamentId, "I_Finales"),
          where("order", "==", i + 1)
        );
        const finalSnapshot = await getDocs(finalQuery);

        if (!finalSnapshot.empty) {
          const finalDoc = finalSnapshot.docs[0];
          const finalDocRef = doc(
            db,
            "I_Torneos",
            tournamentId,
            "I_Finales",
            finalDoc.id
          );

          batch.update(finalDocRef, {
            name: playerName,
            id_player: playerId,
          });
        } else {
          console.error(`No document found in I_Finales with order ${i + 1}`);
        }
      } else {
        console.error(`Player ${playerName} not found in I_Players collection`);
        alert(`Player ${playerName} not found in I_Players collection`);
        return;
      }
    }

    await batch.commit();
    console.log("Players updated in I_Finales collection");
  });

  const loadTercerCuartoButton = document.getElementById(
    "tercerCuarto_finishButton"
  );
  /**
   * Event listener for the "click" event on a button.
   * This function retrieves player names from input fields, validates them,
   * and updates the "I_TercerCuarto" collection in Firestore with the player information.
   * @param {Event} event - The event object.
   */
  loadTercerCuartoButton.addEventListener("click", async () => {
    const player1 = document.getElementById("final_player1").value;
    const player2 = document.getElementById("final_player2").value;

    if (!player1 || !player2) {
      alert("All fields are required!");
      return;
    }
    const tournamentId = await getActiveTournamentId();
    const players = [player1, player2];
    const db = window.db;
    const batch = writeBatch(db);

    for (let i = 0; i < players.length; i++) {
      const playerName = player[i];
      const playerQuery = query(
        collection(db, "I_Torneos", tournamentId, "I_Players"),
        where("name", "==", playerName)
      );
      const playerSnapshot = await getDocs(playerQuery);

      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        const playerData = playerDoc.data();
        const playerId = playerData.id_player;

        const tercerCuartoQuery = query(
          collection(db, "I_Torneos", tournamentId, "I_TercerCuarto"),
          where("order", "==", i + 1)
        );
        const tercerCuartoSnapshot = await getDocs(tercerCuartoQuery);
        if (!tercerCuartoSnapshot.empty) {
          const tercerCuartoDoc = tercerCuartoSnapshot.docs[0];
          const tercerCuartoDocRef = doc(
            db,
            "I_Torneos",
            tournamentId,
            "I_TercerCuarto",
            tercerCuartoDoc.id
          );
          batch.update(tercerCuartoDocRef, {
            name: playerName,
            id_player: playerId,
          });
        } else {
          console.error(
            `No document found in I_TercerCuarto with order ${i + 1}`
          );
        }
      } else {
        console.error(`Player ${playerName} not found in I_Players collection`);
        alert(`Player ${playerName} not found in I_Players collection`);
        return;
      }
    }

    await batch.commit();
    console.log("Players updated in I_TercerCuarto collection");
  });

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

  const displayActiveTournamentName = async () => {
    const db = window.db;
    const q = query(collection(db, "I_Torneos"), where("activo", "==", 1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const activeTournament = querySnapshot.docs[0].data();
      document.getElementById("tournamentName").innerText =
        activeTournament.name;
    } else {
      document.getElementById("tournamentName").innerText =
        "No active tournament found";
    }
  };

  // Display the active tournament name when the page loads
  displayActiveTournamentName();
});
