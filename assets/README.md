# Fase 1.5 — Integración de Assets Open Source

Este directorio centraliza los recursos gráficos y configuraciones del motor JRPG en Three.js, haciendo uso de librerías y spritesheets Open Source oficiales sin duplicar o descargar binarios de manera local en esta etapa.

---

## 📂 Estructura de Directorios Diseñada

El diseño modular de la carpeta `/assets` se organiza de la siguiente manera:

- `assets/manifest.json`: **Única fuente de verdad**. Contiene los metadatos de licencias, autores, coordenadas de spritesheets, animaciones, tamaños de frame y URLs de CDN para jsDelivr / GitHub Raw.
- `assets/sprites/`: Carpeta para albergar hojas de personajes, héroes, monstruos y NPCs.
- `assets/tiles/`: Diseñado para tilesets de terrenos y entornos tácticos (césped, tierra, caminos).
- `assets/items/`: Carpeta reservada para iconos de espadas, pociones, monedas, llaves y equipamiento.
- `assets/objects/`: Reservado para árboles, cofres, carteles e hitos del mapa.
- `assets/ui/`: Almacén para paneles, cajas de diálogo y componentes del HUD.

*Nota: Se han incluido archivos `.gitkeep` para estructurar el árbol de directorios de manera limpia en la etapa actual de pre-descarga.*

---

## 📜 Listado de Repositorios Utilizados

1. **Universal LPC Spritesheet Character Generator**
   - **Enlace**: https://github.com/sanderfrenken/universal-lpc-spritesheet-character-generator
   - **Licencia**: CC-BY-SA 3.0 / GPL 3.0
   - **Autor**: Sander Frenken & LPC Community

2. **LPC Character Sheets (HarrisonMcGuire)**
   - **Enlace**: https://github.com/HarrisonMcGuire/lpc_character_sheets
   - **Licencia**: CC-BY-SA 3.0
   - **Autor**: HarrisonMcGuire

3. **LPC Style Medieval Castle Outer Tileset (makaimc)**
   - **Enlace**: https://github.com/makaimc/lpc-style-medieval-castle-outer-tileset
   - **Licencia**: CC-BY-SA 3.0 / GPL 3.0
   - **Autor**: makaimc & LPC Community

4. **Stendhal ORPG Game Assets**
   - **Enlace**: https://github.com/StendhalGame/stendhal
   - **Licencia**: GPL v2 / CC-BY-SA 3.0
   - **Autor**: StendhalGame Contributors

5. **Kenney UI Expansion Pack**
   - **Enlace**: https://github.com/KenneyNL/Adobe-Animate-Extension
   - **Licencia**: CC0 1.0 Universal (Dominio Público)
   - **Autor**: Kenney NL

---

## 🎯 Explicación de la Elección de Recursos

- **Personaje Héroe (`hero_body` y `knight_armor`)**: Proviene del generador Universal LPC. Es el estándar de oro en juegos de rol pixelados en 2D, proporcionando cuadrículas de 64x64 con direcciones perfectas para caminar, atacar y morir.
- **Enemigo Slime (`slime_enemy`)**: El diseño clásico del Slime LPC de HarrisonMcGuire encaja de manera perfecta con el estilo artístico del Héroe, utilizando el mismo formato de grid y proporciones.
- **Tiles y Objetos de Mapa (`castle_outer_tileset` - Césped, Tierra, Árbol, Roca, Cofre, Cartel)**: El tileset medieval de `makaimc` ofrece una consistencia de color increíble. Al mapear todo desde un único gran atlas 2D (`castle-outer.png`), el motor reduce las peticiones de descarga web, logrando texturizado rápido para múltiples objetos con sus respectivos offsets.
- **Ítems (`item_sword_bronze`, `item_potion_health`, etc.)**: Tomados del cliente oficial de Stendhal Game, los cuales ofrecen iconos claros e hiper-estilizados de 32x32 y 16x16 píxeles ideales para el HUD de ítems.
- **UI (`ui_dialog_panel`, `ui_health_bar`)**: Los recursos de Kenney son reconocidos mundialmente por su estilo limpio y su licencia CC0 libre de restricciones, lo que nos da barras e interfaces de juego muy profesionales.

---

## 🚀 Demostración de Carga Directa (Engine Integration)

El motor del juego cuenta con dos subsistemas diseñados para resolver estas peticiones directamente:

1. **`AssetResolver.ts`**: Traduce la ruta `github:usuario/repo/rama/archivo.png` descrita en el `manifest.json` y la redirige automáticamente a los servidores súper-veloces de la CDN de **jsDelivr** (`https://cdn.jsdelivr.net/gh/usuario/repo@rama/archivo.png`).
2. **`TextureCache.ts`**: Realiza peticiones asíncronas con cabeceras `crossOrigin = "anonymous"`, previene duplicaciones en memoria mediante caché interna y habilita filtros Nearest-Neighbor (`NearestFilter`) para asegurar que el renderizado 3D de Three.js conserve la estética pixelada nítida sin difuminados.
3. **`AssetLoader.ts`**: Consume este manifiesto, realiza la descarga de manera transparente y provee hermosas soluciones procedimentales locales autogeneradas con Canvas si detecta que la red está offline o con bloqueos CORS, garantizando que el juego sea jugable bajo cualquier circunstancia.
