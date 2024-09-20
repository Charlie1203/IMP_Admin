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

document.addEventListener("DOMContentLoaded", function () {
  const createTournamentButton = document.getElementById("createTournament");
  if (createTournamentButton) {
    createTournamentButton.addEventListener("click", async () => {
      const tournamentName = document.getElementById("tournamentName").value;
      const tournamentID = document.getElementById("tournamentID").value;
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      const urlImage = document.getElementById("urlImage").value;
      const activo = parseInt(document.getElementById("activo").value, 10);

      if (
        !tournamentName ||
        !tournamentID ||
        !startDate ||
        !endDate ||
        !urlImage ||
        !activo
      ) {
        alert("All fields are required!");
        return;
      }

      const tournamentData = {
        name: tournamentName,
        start_date: startDate,
        finish_date: endDate,
        logo: urlImage,
        activo: activo,
        active_bracket: "",
        apuestas: 0,
      };

      try {
        const db = window.db;
        // Add players to the I_Players sub-collection

        if (tournamentData.activo === 1) {
          const activeTournamentQuery = query(
            collection(db, "I_Torneos"),
            where("activo", "==", 1)
          );
          const activeTournamentsSnapshot = await getDocs(
            activeTournamentQuery
          );

          const batch = writeBatch(db);

          activeTournamentsSnapshot.forEach((doc) => {
            const tournamentRef = doc.ref;
            batch.update(tournamentRef, { activo: 0 });
          });
          await batch.commit();
        }

        const players = await getPlayers();
        const batch = writeBatch(db);

        // Add the tournament data to Firestore
        await setDoc(doc(db, "I_Torneos", tournamentID), tournamentData);
        console.log("Document written with ID: ", tournamentID);

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
            const matchData = { orden: i };
            for (let j = 1; j <= 18; j++) {
              const holeNumber = j.toString().padStart(2, "0"); // Format number with leading zero
              matchData[`H${holeNumber}`] = 0;
            }
            matchData.name = "";
            matchData.id_player = "";
            batch.set(matchRef, matchData);
          }
        };

        // Function to create the I_Resultados collection with 4 documents
        const createResults = () => {
          for (let i = 1; i <= 4; i++) {
            const resultRef = doc(
              collection(db, "I_Torneos", tournamentID, "I_Resultados")
            );
            const resultData = {
              id_player: "",
              name: "",
              orden: i,
            };
            batch.set(resultRef, resultData);
          }
        };

        const createEmptyCollection = (collectionName) => {
          const placeholderRef = doc(
            collection(db, "I_Torneos", tournamentID, collectionName)
          );
          batch.set(placeholderRef, {}); // Empty object as a placeholder document
        };

        // Create matches for different stages
        createMatches("I_Cuartos", 8);
        createMatches("I_Semifinales", 4);
        createMatches("I_Finales", 2);
        createMatches("I_TercerCuarto", 2);

        // Create the I_Resultados collection
        createResults();

        // createEmptyCollection("I_Clasificacion_Cuartos");
        // createEmptyCollection("I_Clasificacion_Semis");

        await batch.commit();

        console.log("Players, matches, and results added to the tournament");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    });
  } else {
    console.log("createTournamentButton not found");
  }
});
