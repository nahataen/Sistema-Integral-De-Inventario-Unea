# Prompt Mejorado para Generar Filas con Botón de Eliminación

Este prompt está diseñado para implementaciones donde se generan columnas dinámicamente (columns), asegurando que cada fila cuente con un botón para eliminarla. Sin embargo, existen columnas protegidas que **no deben eliminarse bajo ninguna circunstancia**: **ID**, **Zona**, y **Campus**.

## Requerimientos

* El sistema debe permitir crear y eliminar **columnas dinámicas**.
* Cada columna creada puede ser de **texto** o de **imágenes**, según lo que el usuario necesite agregar a los registros.
* Los registros deben ser **editables** en cualquier momento.
* Las columnas esenciales **ID**, **Zona**, y **Campus** están protegidas y **no deben poder eliminarse**.

## Prompt Mejorado

Utiliza el siguiente prompt como base para tu sistema o IA generadora:

> "Necesito generar columnas dinámicas (columns) dentro de una tabla o contenedor. Cada fila debe tener la capacidad de eliminarse mediante un botón visible y funcional. Sin embargo, existen columnas esenciales llamadas **ID**, **Zona**, y **Campus** que deben estar protegidas y no deben poder eliminarse. Estas columnas deben omitirse del sistema de eliminación o tener el botón deshabilitado. Asegura que la lógica discrimine correctamente estas columnas protegidas y permita eliminar únicamente las columnas añadidas por el usuario."

---

Si deseas generar un ejemplo funcional en HTML/CSS/JS o integrarlo en React, puedo ayudarte.
