# Sistema de Almacén UNEA

![UNEA Logo](https://www.unea.edu.mx/hubfs/Flujo%20Ingenier%C3%ADa%20Industrial%202022%20Marzo/Logos%20Marcas/logos%202024/unea.svg)


Aplicación **multiplataforma** (Windows y macOS) desarrollada con **Tauri**, **React**, **Vite**, **TailwindCSS** y **SQLite**.
El sistema permite administrar múltiples bases de datos de inventario de manera local, sin depender de internet a requerimientos de la institución.

---

## 🚀 Características principales

- 🔍 **Gestión de bases de datos SQLite**: importar, exportar, eliminar y listar.
- 🎨 **Modo oscuro/claro** con persistencia en `localStorage`.
- 📂 **Compatibilidad multiplataforma** gracias a `@tauri-apps/api/path` (`appDir`) para rutas dinámicas seguras.
- 🔑 **Protección al eliminar bases de datos** con confirmación y contraseña.
- ⚡ **Desarrollo rápido** con **Vite** como bundler.
- 📊 **Interfaz moderna** con **React + TailwindCSS**.
- 🖥️ **Optimizado para escritorio** con **Tauri** (menor consumo de recursos que Electron).

---

## 🛠️ Tecnologías utilizadas

- [Tauri](https://tauri.app/) → empaquetado multiplataforma.
- [React](https://react.dev/) → interfaz de usuario.
- [Vite](https://vitejs.dev/) → bundler y servidor de desarrollo ultrarrápido.
- [TailwindCSS](https://tailwindcss.com/) → estilos rápidos y modernos.
- [SQLite](https://www.sqlite.org/) → almacenamiento local de datos.
- [TypeScript](https://www.typescriptlang.org/) → tipado seguro y mantenimiento.

---

##  Estructura del proyecto

```bash
├── src/
│   ├── components/       # Componentes de React
│   ├── pages/            # Vistas principales
│   ├── utils/            # Funciones auxiliares
│   ├── App.tsx           # Punto de entrada de la interfaz
│   └── main.tsx          # Configuración inicial
├── public/               # Archivos estáticos
├── tauri/                # Configuración del backend de Tauri
├── index.html            # Archivo HTML principal
├── package.json          # Dependencias del frontend
└── vite.config.ts        # Configuración de Vite
