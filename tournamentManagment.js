// index.js
import { getPlayers } from "./players.js";

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
	};

	// Display the active tournament name when the page loads
	displayActiveTournamentName();
});

let allPlayers = [];
let currentInputId = null;

document.addEventListener("DOMContentLoaded", function () {
	const playerInputs = document.querySelectorAll('[id^="cuartos_player"]');
	console.log("Player inputs found:", playerInputs);

	if (playerInputs.length > 0) {
		playerInputs.forEach((input) => {
			input.addEventListener("click", (event) => {
				currentInputId = event.target.id; // Guardar el ID del input que abrió el modal
				openPlayersModal();
			});
		});
	} else {
		console.error(
			"No player inputs found with IDs starting with 'cuartos_player'."
		);
	}

	const searchPlayerInput = document.getElementById("searchPlayerInput");
	if (searchPlayerInput) {
		searchPlayerInput.addEventListener("input", filterPlayers);
	} else {
		console.error("Element with ID 'searchPlayerInput' not found.");
	}
});

async function openPlayersModal() {
	allPlayers = await getPlayers();

	// Ordenar los jugadores por nombre en orden alfabético
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
		listItem.addEventListener("click", () => selectPlayer(player.name)); // Agregar evento de clic
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
		document.getElementById(currentInputId).value = playerName; // Llenar el input con el nombre del jugador seleccionado
	}
	closePlayersModal(); // Cerrar el modal después de seleccionar un jugador
}

function closePlayersModal() {
	document.getElementById("modalPlayers").style.display = "none";
}
