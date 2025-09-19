# ⚡ React + TypeScript + Vite

Este proyecto está configurado con **React + TypeScript + Vite**, ofreciendo un entorno rápido, moderno y flexible para el desarrollo frontend.  
Incluye soporte para **HMR (Hot Module Replacement)** y reglas de **ESLint** para mantener un código limpio y consistente.  

---

## 🚀 Tecnologías principales

- ⚛️ [React](https://react.dev/) – Librería para interfaces de usuario.  
- 🌀 [Vite](https://vitejs.dev/) – Bundler ultrarrápido para desarrollo.  
- 🟦 [TypeScript](https://www.typescriptlang.org/) – Tipado estático para JavaScript.  
- 🔍 [ESLint](https://eslint.org/) – Reglas y análisis de calidad de código.  

---

## 📦 Plugins oficiales disponibles

- [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) → usa **Babel** para Fast Refresh.  
- [`@vitejs/plugin-react-swc`](https://github.com/vitejs/vite-plugin-react-swc) → usa **SWC** para Fast Refresh.  

---

## 🛠️ Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

---

## 🔧 Configuración de ESLint

Si deseas habilitar reglas más estrictas y con soporte de tipado, actualiza tu configuración con:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // Opción más estricta:
      tseslint.configs.strictTypeChecked,
      // Reglas de estilo:
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

También puedes instalar plugins adicionales para reglas específicas de React:  

```bash
npm install eslint-plugin-react-x eslint-plugin-react-dom --save-dev
```

Configuración sugerida:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

## 📂 Estructura del proyecto

```
├── src/
│   ├── assets/        # Imágenes y recursos estáticos
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Vistas/páginas principales
│   ├── App.tsx        # Componente raíz
│   └── main.tsx       # Punto de entrada
├── public/            # Archivos estáticos
├── tsconfig.json      # Configuración TypeScript
├── vite.config.ts     # Configuración Vite
└── eslint.config.js   # Configuración ESLint
```

---

## ✨ Características

✔️ Configuración mínima pero lista para producción.  
✔️ Hot Reloading instantáneo.  
✔️ Compatible con ESLint + TypeScript.  
✔️ Preparado para proyectos escalables.  

---

## 📜 Licencia

Este proyecto se distribuye bajo la licencia **MIT**.  
¡Siéntete libre de usarlo, mejorarlo y compartirlo! 🚀
