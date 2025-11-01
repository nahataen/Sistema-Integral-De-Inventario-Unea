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

## 🐳 Configuración con Docker

Para migrar tu entorno de desarrollo a otra computadora o asegurar consistencia, puedes usar Docker.

### Prerrequisitos
- [Docker](https://www.docker.com/get-started) instalado en tu sistema.
- [Docker Compose](https://docs.docker.com/compose/install/) (generalmente incluido con Docker Desktop).

### Configuración
1. Clona el repositorio en la nueva computadora.
2. Asegúrate de tener Docker corriendo.
3. Ejecuta el siguiente comando para construir y ejecutar el contenedor de desarrollo:

```bash
docker-compose up --build
```

Esto iniciará el servidor de desarrollo en `http://localhost:3000`.

### Notas importantes
- El contenedor incluye Node.js 18, Rust 1.65+ y todas las dependencias de Tauri.
- Los cambios en el código se reflejan automáticamente gracias a los volúmenes montados.
- Para construir la aplicación nativa, necesitarás ejecutar `npm run tauri build` en tu host (fuera del contenedor), ya que requiere acceso al sistema operativo nativo.

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
├── Dockerfile            # Configuración de Docker
├── docker-compose.yml    # Configuración de Docker Compose
└── vite.config.ts        # Configuración de Vite
