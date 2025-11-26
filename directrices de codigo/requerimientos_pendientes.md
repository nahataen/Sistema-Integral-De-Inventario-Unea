# Requerimientos Pendientes

## Introducción

Este documento detalla los requerimientos pendientes para el sistema de gestión de bases de datos del proyecto Sistema-Almacen-Unea. Se basa en las especificaciones identificadas en los documentos de código y se complementa con un análisis de revisión de código que evalúa el estado actual de implementación, fortalezas, debilidades y recomendaciones para cada requerimiento.

## Requerimientos Detallados

### 🔒 Validación de Tablas

**Descripción**: Si se intenta crear una tabla con un nombre ya existente, mostrar un aviso indicando que no es posible y solicitar un nombre diferente.

**Estado de Implementación**: No implementado

**Contexto Actual**:
- El componente `CreateTableModal.tsx` realiza validación básica (nombre no vacío)
- No verifica duplicados de nombres de tabla
- Llama al comando backend `create_table` sin validación adicional

**Fortalezas**: Separación clara de responsabilidades, manejo de errores con notificaciones toast.

**Debilidades**: Falta validación avanzada, estilos inline reducen mantenibilidad.

**Recomendaciones**: Implementar verificación de nombres existentes en frontend y backend.

**UI/UX Specifications**:
- Implement real-time validation in the table name input field within `CreateTableModal.tsx`.
- Error states: Display red border and background tint on the input when duplicate name is detected.
- Messaging: Show clear error message below the input: "A table with this name already exists. Please choose a unique name."
- User guidance: Provide suggestions like "Try adding a number (e.g., 'Table_2') or use a different variation."
- Disable the "Create Table" button when validation fails, with visual feedback (grayed out).
- Success state: Green checkmark icon when name is valid and available.

**Technical Implementation Suggestions**:
- Use React hooks: `useState` for validation state, `useEffect` for real-time checking.
- Fetch existing table names on modal open using Tauri invoke to `get_table_names` or similar command.
- On input change, debounce the validation to avoid excessive backend calls (use lodash.debounce or custom hook).
- Integrate with existing toast notifications for backend validation errors.
- Use CSS modules for error styling, ensuring responsive design and consistency with the app's theme.
- Accessibility: Add `aria-invalid` and `aria-describedby` attributes for screen readers.
- Performance: Memoize the validation function with `useCallback` if needed.

### 🔐 Validación de Columnas

**Descripción**: Si se intenta crear una columna con un nombre repetido, impedir la acción y solicitar otro nombre.

**Estado de Implementación**: Parcialmente implementado

**Contexto Actual**:
- Backend protege columnas ID, Zona, Campus de eliminación
- No hay validación frontend para nombres duplicados de columnas
- Soporte para tipos dinámicos (texto/imagen)

**Fortalezas**: Validación backend robusta, UI clara para columnas protegidas.

**Debilidades**: Falta validación de duplicados, no hay confirmación para agregar columnas.

**Recomendaciones**: Agregar validación frontend para nombres de columnas duplicados.

**UI/UX Specifications**:
- Real-time feedback in column name inputs during table creation in `CreateTableModal.tsx`.
- Error states: Red highlight on input field, exclamation icon, and message "Column name already exists in this table."
- Prevent adding duplicate columns: Disable the "Add Column" button when validation fails.
- User guidance: Suggest unique names or auto-append numbers.
- Form validation patterns: Validate on blur and input change, show summary of errors.

**Technical Implementation Suggestions**:
- Track column names in component state as an array.
- On column name input change, check against the array using `includes` or a Set for efficiency.
- Use `useState` for error messages per column.
- Integrate with form submission to prevent invalid tables.
- Use CSS modules for consistent styling.
- Accessibility: Ensure error messages are associated with inputs via `aria-describedby`.
- Performance: For large forms, consider optimizing re-renders with `React.memo`.

### 🧹 Mejorar Diseño de Eliminación de Columnas

**Descripción**: Rediseñar la UI/UX del mecanismo para eliminar columnas, haciéndolo más intuitivo y visualmente claro.

**Estado de Implementación**: Implementado pero mejorable

**Contexto Actual**:
- Botón de eliminación en headers de tabla para columnas no protegidas
- Confirmación para eliminación

**Fortalezas**: Indicación clara de columnas protegidas.

**Debilidades**: UI podría ser más intuitiva.

**Recomendaciones**: Rediseñar con mejores indicadores visuales, confirmaciones más claras.

**UI/UX Specifications**:
- Use a trash icon button with tooltip "Delete Column" on hover for non-protected columns.
- On click, display a confirmation modal with column name, data type, and warning about data loss.
- Visual cues: Red color scheme for delete actions, grayed out/disabled for protected columns with lock icon.
- Intuitive interactions: Clear "Cancel" and "Delete" buttons in modal, keyboard shortcuts (Enter to confirm, Escape to cancel).
- Feedback: Loading state during deletion, success/error toasts.

**Technical Implementation Suggestions**:
- Replace simple text button with `IconButton` component using react-icons or similar.
- Implement confirmation modal using a library like react-modal or custom component.
- State management: Use `useState` for modal visibility and selected column.
- Integrate with Tauri `delete_column` command, handle async with loading states.
- Use CSS modules for styling, ensure mobile responsiveness.
- Accessibility: Modal should trap focus, have proper ARIA roles (dialog), keyboard navigation.
- Performance: Lazy load modal component if not frequently used.

### 🖼️ Subir Imagen al Crear un Registro

**Descripción**: Permitir seleccionar e ingresar una imagen desde el modal al crear un nuevo registro.

**Estado de Implementación**: No implementado (esquema listo)

**Contexto Actual**:
- Esquema soporta columnas BLOB para imágenes
- No hay UI de subida en `CreateRecordPage.tsx`
- Comentarios placeholder en backend

**Fortalezas**: Preparación backend para imágenes.

**Debilidades**: Falta implementación completa de subida.

**Recomendaciones**: Agregar input de archivo y lógica de subida en frontend y backend.

**UI/UX Specifications**:
- File input with drag-and-drop area in the record creation modal (`CreateRecordPage.tsx`).
- Preview: Display thumbnail of selected image with remove option.
- Validation: Check file type (jpg, png, gif), size limit (e.g., 5MB), show error messages.
- Progress: Upload progress bar during submission.
- Guidance: Instructions for optimal image size/resolution.

**Technical Implementation Suggestions**:
- Use HTML `<input type="file" accept="image/*">` with custom styling for drag-drop.
- Handle file selection: Use `FileReader` to create preview URL, store file in state.
- Validation: On select, check `file.size` and `file.type`.
- Preview: `<img>` with `src={URL.createObjectURL(file)}`, cleanup on unmount.
- Send file to backend: Convert to base64 or use Tauri file handling, invoke `create_record_with_image`.
- Use CSS modules for styling the upload area.
- Accessibility: Add `aria-label` for input, describe preview.
- Performance: Compress images client-side if large, using libraries like browser-image-compression.

### 🖱️ Doble Clic para Detalles

**Descripción**: Al hacer doble clic en un registro, abrir una vista con información más detallada en una nueva página.

**Estado de Implementación**: No implementado

**Contexto Actual**:
- `TablaSegura.tsx` tiene selección de fila con clic simple
- No hay manejadores de doble clic

**Fortalezas**: Selección de fila existente.

**Debilidades**: Falta funcionalidad de doble clic.

**Recomendaciones**: Implementar `onDoubleClick` para abrir vista detallada.

**UI/UX Specifications**:
- Double-click on table row in `TablaSegura.tsx` navigates to detailed view.
- Detail page structure: Header with record ID/title, sections for each field (text, images), edit/save buttons.
- Navigation: Back button to table view, breadcrumbs.
- Data presentation: Images in gallery view, text in readable format, responsive layout.
- Interactions: Edit mode toggle, save changes with validation.

**Technical Implementation Suggestions**:
- Add `onDoubleClick` handler to table row: `() => navigate('/record/${recordId}')`.
- Create new page component `RecordDetailPage.tsx` with routing.
- Fetch record data on mount using Tauri `get_record` command.
- State management: `useState` for record data, edit mode.
- Use CSS modules for layout, grid/flexbox for responsive design.
- Accessibility: Semantic HTML, keyboard navigation for actions.
- Performance: Lazy load detail page, memoize components.

## Contexto Adicional y Sugerencias

### Fortalezas Generales
- Seguridad de tipos con TypeScript
- Manejo de errores consistente
- Separación modular entre frontend y backend

### Debilidades Generales
- Mantenibilidad: Estilos inline, componentes grandes
- Rendimiento: Falta memoización
- Pruebas: Ausentes
- Documentación: Limitada

### Recomendaciones de Alto Prioridad
1. Implementar funcionalidad de doble clic
2. Completar subida de imágenes
3. Agregar validación frontend
4. Refactorizar componentes grandes

### Recomendaciones de Prioridad Media
5. Mejorar gestión de estado con useReducer
6. Agregar memoización
7. Implementar límites de error
8. Agregar estados de carga

### Recomendaciones de Baja Prioridad
9. Internacionalización
10. Pruebas unitarias
11. Documentación completa
12. Accesibilidad WCAG

## Frontend Implementation Best Practices

### Component Architecture
- Adopt functional components with React hooks for modern, maintainable code.
- Break down large components (like `CreateTableModal.tsx`) into smaller, reusable atoms (buttons, inputs) and molecules (form sections).
- Follow separation of concerns: UI logic in components, business logic in custom hooks or services.
- Use TypeScript interfaces for props to ensure type safety.

### State Management
- Use `useState` for local component state, `useContext` for shared state across components.
- For complex forms (table/column creation), implement `useReducer` for predictable state updates.
- Integrate with Tauri backend: Use invoke commands for async operations, manage loading/error states centrally.

### Accessibility (WCAG Compliance)
- Implement semantic HTML: Use `<form>`, `<label>`, `<button>`, `<dialog>` appropriately.
- Add ARIA attributes: `aria-label`, `aria-describedby`, `aria-invalid` for dynamic content.
- Ensure keyboard navigation: Tab order, Enter/Space for actions, Escape for modals.
- Color contrast: Meet WCAG AA standards (4.5:1 for normal text).
- Screen reader support: Test with NVDA/JAWS, provide alt text for images.
- Focus management: Auto-focus on modals, restore focus on close.

### Performance Optimizations
- Memoization: Use `React.memo`, `useMemo`, `useCallback` to prevent unnecessary re-renders.
- Lazy loading: Implement `React.lazy` for route-based components, dynamic imports for heavy libraries.
- Image optimization: Compress uploads, use lazy loading for thumbnails.
- Bundle splitting: Configure Vite for code splitting to reduce initial load time.
- Virtual scrolling: For large tables, consider libraries like react-window.

### Integration with Existing Tauri Backend
- Consistent error handling: Use try-catch with user-friendly toast messages.
- Loading states: Show spinners/buttons during async operations.
- Data synchronization: Refresh table lists after create/delete operations.
- File handling: Leverage Tauri's file system APIs for secure image uploads.
- Type safety: Define shared TypeScript interfaces for frontend-backend data structures.