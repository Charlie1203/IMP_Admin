function collectScores() {
	// Selecciona todos los inputs de puntuación
	const inputs = document.querySelectorAll(".score-input");

	// Objeto para almacenar los valores
	const scores = {};

	// Recorre todos los inputs y los guarda en el objeto
	inputs.forEach((input, index) => {
		// Asigna el valor del input al objeto usando el número del hoyo como clave
		scores[`hoyo${index + 1}`] = input.value.trim();
	});

	console.log(scores); // Para ver el objeto en la consola (puedes eliminar esto)
	return scores; // Retorna el objeto con los valores
}
