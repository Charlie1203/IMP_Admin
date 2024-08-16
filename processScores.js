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

  storeScores(scores, collectionName);
  return; // Retorna el objeto con los valores
}

function storeScores(scores, collectionName) {
  console.log(scores);
  console.log(collectionName);
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
