// Obtener todos los elementos <a> dentro del nav
var navLinks = document.querySelectorAll('.nav a');

// Recorrer cada enlace y agregar el evento para cambiar el color al pasar el ratón por encima
navLinks.forEach(function(link) {
    link.addEventListener('mouseover', function() {
        var randomColor = getRandomColor();
        this.style.color = randomColor;
    });

    link.addEventListener('mouseout', function() {
        this.style.color = 'whitesmoke';
    });
});

// Función para generar un color aleatorio entre rojo, verde y azul
function getRandomColor() {
    var colors = ['red', 'green', 'blue'];
    var randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}
