# Entropy TCG

Web oficial de **Entropy**, un juego de cartas de estrategia táctica desarrollado en Alicante.

**Web:** https://artearc.github.io/Entropy/

## Qué incluye

- **Inicio:** presentación del juego, las tres entropías y la galería de cartas.
- **Jugar:** tutorial jugable sobre el tablero de 5×4, fases del turno, simulador de entropía y glosario de palabras clave.
- **Cartas:** las 448 cartas de la Beta 0.2 con buscador, filtros y vista 3D de cada carta.
- **Mazos:** constructor de mazos con las reglas de construcción, curva de costes, comprobación de entropía y códigos para compartir.

La web está en inglés (por defecto), español, francés, italiano y alemán.

## Idiomas

- Inglés y español están escritos en `index.html` (cada texto lleva su `<span lang="en">` y su `<span lang="es">`) y en los mensajes de `js/` como `E.L("español", "English")`.
- Francés, italiano y alemán salen de `data/translations.py`: una fila por texto con su versión en inglés y sus tres traducciones. Después de editarlo:

```
python data/translations.py
```

Eso regenera `js/locales/fr.js`, `it.js` y `de.js`. Si añades un texto nuevo en inglés, añade también su fila; si no, en esos tres idiomas se mostrará en inglés.

## Estructura

```
index.html            página y estilos
js/                   lógica (idioma, glosario, partículas, cartas, mazos, tutorial, rutas)
assets/               imágenes, cartas y datos
assets/cards-data.js  datos de las cartas (generado)
data/                 transcripción de las cartas y script que genera cards-data.js
```

## Actualizar las cartas

Los datos de cada carta están en `data/raw.txt` (nombre, tipo, coste, estadísticas y texto) y `data/pips.txt` (requisito de entropía). Después de editarlos:

```
python data/build.py
```

## Probar en local

```
python -m http.server 8000
```

y abre http://localhost:8000.

Sin dependencias que instalar: three.js y GSAP se cargan desde CDN.
