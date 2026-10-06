# TIENDA — SENA Market

Software de gestión de inventario para tienda (Vue 3 + Vite + Pinia + Quasar).

## Pantallas

| Ruta | Contenido |
|---|---|
| `/#/` | Bienvenida (sin menú, cuadro animado S→E→N→A) |
| `/#/dashboard` | Panel con indicadores y alertas de stock |
| `/#/inventario` | Productos: crear, editar, eliminar, buscar y filtrar |
| `/#/movimientos` | Entradas, salidas y ajustes de inventario |
| `/#/categorias` | Categorías de productos |
| `/#/proveedores` | Proveedores |
| `/#/reportes` | Valorización e indicadores, exportación CSV y PDF |

Al entrar desde la bienvenida se activa el menú hamburguesa con la navegación
del sistema.

## Stack

- **Vue 3** (`<script setup>`) + **Vite**
- **Pinia** con `pinia-plugin-persistedstate` (los datos se guardan en
  `localStorage`; hoy no hay backend)
- **Quasar** (componentes y layout)
- **Vue Router** con historial por hash (`/#/...`)
- **GSAP** (animación 3D de la bienvenida)
- **SweetAlert2** (único sistema de alertas: `src/utils/alertas.js`)
- **jsPDF** (exportación de reportes en PDF; CSV se genera a mano)

## Ejecutar en local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ en producción
```

## Decisiones transversales

- **Moneda en COP**: toda la presentación de dinero pasa por
  `src/utils/moneda.js` → `formatearMoneda()` (ej. `$1.250.000 COP`).
  Los stores guardan números crudos, sin `$` ni `COP`.
- **Alertas**: sin `alert()`, `confirm()` ni `prompt()` nativos; todo por
  `src/utils/alertas.js` (SweetAlert2).
- **Sin cantidades "monetizadas"**: stock, cantidades, códigos e IDs se
  muestran como números simples.

## Pruebas

```bash
node fase7.test.mjs        # stores y utilidades
node fase7.form.test.mjs   # formulario de productos (render propio, sin navegador)
```

## Análisis del proyecto

El documento viviente con fases, decisiones y pendientes es
[`ANALISIS_ESTRUCTURA.md`](./ANALISIS_ESTRUCTURA.md).

## Despliegue (Render)

Sitio estático:

- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`

## Pendiente

- Backend con API REST (**axios**) para reemplazar la persistencia en
  `localStorage`.
