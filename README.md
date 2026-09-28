# 📦 Sistema integral de inventario UNEA — TypeScript

> App de escritorio (Tauri + React + Vite + SQLite) para administrar inventarios locales de la UNEA sin depender de internet.

## Stack

Real, según `package.json` y `src-tauri/Cargo.toml`:

- Frontend: React 19 + React DOM + react-router-dom 7 + Vite 7 + TypeScript 5.8
- Escritorio: Tauri 1.5 (Rust 2021, `tauri-build 1.5.6`)
- Backend Tauri (Rust): `rusqlite` (bundled), `serde`/`serde_json`, `chrono`, `dirs`, `base64`, `image`, `genpdf`, `typst`/`typst-render`
- UI/Globales: `jspdf`, `react-hot-toast`, `react-icons`, CSS propio (`src/styles/`, `src/App.css`)
- Dev: ESLint 9, Jest 30, Puppeteer, `@vitejs/plugin-react`
- Datos: SQLite local (vía backend Tauri, rutas con `@tauri-apps/api/path`)
- Nota honesta: el README anterior mencionaba TailwindCSS, pero no está en `dependencies`/`devDependencies`; los estilos son CSS propios.

## Estructura

Árbol real (resumido, sin `.git`/`node_modules`/`target`):

```text
index.html
package.json
vite.config.ts (puerto 3000, chunks vendor/tauri)
eslint.config.js
src/
  main.tsx (StrictMode + BrowserRouter)
  App.tsx (8 rutas lazy: /, /configuracion, /pagina, /about, /hub_tablas, /editar_fila, /create-record, /detalles-consultas)
  components/layout/Header.tsx, Sidebar.tsx
  components/ui/DatabaseTable.tsx, TableCard.tsx, CreateTableModal.tsx, ImportarExportar.tsx, TablaSegura.tsx, ActionButton.tsx
  pages/dashboard/DatabaseDashboard.tsx
  pages/database/hub_tablas.tsx, pagina.tsx, editar_fila.tsx
  pages/create-record/CreateRecordPage.tsx
  pages/pagina-detalles/detalles-consultas.tsx
  pages/settings/Configuracion.tsx
  pages/home/Home.tsx, about.tsx
  context/TableCreationContext.tsx, ThemeContext.tsx
  services/api/index.ts, services/database/index.ts
  utils/index.ts, utils/pdfGenerator.ts
  types/index.ts, styles/, hooks/, assets/
src-tauri/
  Cargo.toml, build.rs, tauri.conf.json, icons/
docs/hub_tablas.md
directrices de codigo/ (*.md de arquitectura, despliegue, pruebas, etc.)
public/unealogo.svg
```

## Cómo correr

```bash
npm install
npm run dev      # Vite en http://localhost:3000
npm run build    # tsc -b && vite build
npm run preview  # previsualizar build
npm run lint     # eslint .
```

App de escritorio (requiere toolchain Rust + Tauri CLI):

```bash
npx tauri dev    # modo desarrollo escritorio
npx tauri build  # empaquetado Windows/macOS
```

## Estado/Notas

- Proyecto académico/funcional en desarrollo: dashboard, hub de tablas, crear/editar registros, importar/exportar SQLite, modo oscuro/claro, generación de PDF.
- Sin `Dockerfile`/`docker-compose` en el repo (se eliminaron según historial).
- La persistencia es local (SQLite); no hay backend remoto.
