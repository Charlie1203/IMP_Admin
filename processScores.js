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

export function collectScores() {
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
  let tournamentID = getActiveTournamentId();

  storeScores(scores, tournamentId, collectionName);
  return; // Retorna el objeto con los valores
}

function storeScores(scores, tournamentId, collectionName) {
  // chequear que tournament id y collectionname no sean null, si son null return con un  mensaje
  // guardar en collectionName, los scores. H01, H02, H03, H04, H05, H06, H07, H08, H09, H10, H11, H12, H13, H14, H15, H16, H17, H18 (FIELDS)
  // POARA ESTO NECESITAS IDENTIFICAR CUAL HOYO ES CUAL EN EL OBJECTO SCORES Y GUARDARLO ACORDE
  return;
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
