// index.js
import { getPlayers } from "./players.js";

import {
  doc,
  setDoc,
  collection,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getPlayers } from "./players.js"; // Assuming getPlayers is exported from players.js
import { v4 as uuidv4 } from "https://jspm.dev/uuid"; // Import UUID function

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("createTournament")
    .addEventListener("click", async () => {
      const tournamentName = document.getElementById("tournamentName").value;
      const tournamentID = document.getElementById("tournamentID").value;
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      const urlImage = document.getElementById("urlImage").value;

      if (
        !tournamentName ||
        !tournamentID ||
        !startDate ||
        !endDate ||
        !urlImage
      ) {
        alert("All fields are required!");
        return;
      }

      const tournamentData = {
        name: tournamentName,
        start_date: startDate,
        finish_date: endDate,
        urlImage: urlImage,
      };

      try {
        const db = window.db;

        // Add the tournament data to Firestore
        await setDoc(doc(db, "I_Torneos", tournamentID), tournamentData);
        console.log("Document written with ID: ", tournamentID);

        // Add players to the I_Players sub-collection
        const players = await getPlayers();
        const batch = writeBatch(db);

        players.forEach((player) => {
          const playerRef = doc(
            db,
            "I_Torneos",
            tournamentID,
            "I_Players",
            player.name
          );
          batch.set(playerRef, {
            name: player.name,
            rank: player.rank,
            id_player: uuidv4(),
          });
        });

        // Function to create matches in a given collection
        const createMatches = (collectionName, numberOfDocuments) => {
          for (let i = 1; i <= numberOfDocuments; i++) {
            const matchRef = doc(
              collection(db, "I_Torneos", tournamentID, collectionName)
            );
            const matchData = { order: i };
            for (let j = 1; j <= 18; j++) {
              matchData[`H${j}`] = 0;
            }
            matchData.name = "";
            matchData.id_player = "";
            batch.set(matchRef, matchData);
          }
        };

        // Create matches for different stages
        createMatches("I_Cuartos", 8);
        createMatches("I_Semifinales", 4);
        createMatches("I_Finales", 2);
        createMatches("I_TercerPuesto", 2);

        await batch.commit();
        console.log("Players and matches added to the tournament");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    });
});
