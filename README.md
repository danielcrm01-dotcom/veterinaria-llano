# Veterinaria Llano — Base de datos MongoDB

Capa de datos para un sistema de **registro de mascotas y servicios veterinarios** (Villavicencio, Meta).
Proyecto de Bases de Datos II — Ingeniería Informática, AUNAR Villavicencio.

**Integrantes:** _(nombres del grupo)_ · **Grupo:** _#_ · **Docente:** _(nombre)_

## Contenido

| Archivo | Para qué sirve |
|---|---|
| `datos_iniciales.js` | Crea las 4 colecciones (con validación `$jsonSchema`) e inserta los datos |
| `consultas.js` | 10 consultas, 4 actualizaciones, 3 agregaciones y 3 índices con `explain` |
| `crear_usuarios.js` | Crea el usuario administrador y el usuario de aplicación |
| `mongod.cfg.ejemplo` | Sección `security` para activar la autenticación |
| `crud_mascotas.py` | Programa Python (PyMongo) con CRUD completo, lee `.env` |
| `.env.example` | Plantilla de la cadena de conexión (copiar como `.env`) |
| `docs/` | Documento de diseño (PDF) y guía de comandos para las evidencias |

## Modelo (resumen)

`propietarios` ← `mascotas` ← `consultas` y `vacunas`

- **Referenciado:** `mascotas.propietarioId`, `consultas.mascotaId`, `vacunas.mascotaId`.
- **Embebido:** `mascotas.historialPeso[]`, `consultas.veterinario`, `consultas.signosVitales`, `consultas.tratamientos[]`, `propietarios.direccion`.

## Requisitos

- MongoDB Community 7.0 o superior (o Docker / Atlas M0) y `mongosh`
- Python 3.10+ (solo para `crud_mascotas.py`)

## Instalación y ejecución desde cero

1. **Instalar MongoDB** y verificar: `mongosh --version`.
2. **Crear usuarios** (con la autenticación aún desactivada):
   `mongosh crear_usuarios.js` — pedirá las contraseñas por consola.
3. **Activar la autenticación:** agregar al `mongod.cfg` lo que muestra `mongod.cfg.ejemplo` y reiniciar el servicio.
4. **Cargar los datos** con el usuario de aplicación:
   ```
   mongosh "mongodb://app_veterinaria@localhost:27017/veterinaria_llano?authSource=veterinaria_llano" datos_iniciales.js
   ```
5. **Ejecutar las consultas:** el mismo comando con `consultas.js`.
6. **Programa Python:**
   ```
   python -m venv .venv && .venv\Scripts\activate      # Linux/Mac: source .venv/bin/activate
   pip install -r requirements.txt
   copy .env.example .env                               # Linux/Mac: cp .env.example .env
   # editar .env y escribir la contraseña de app_veterinaria
   python crud_mascotas.py
   ```
7. **Respaldo y restauración:** ver `docs/guia_comandos.md`.

> `datos_iniciales.js` es re-ejecutable: borra y recrea las colecciones.
> Nunca suba el archivo `.env` a GitHub (ya está en `.gitignore`).

## Próximos pasos del proyecto

API REST (FastAPI/Express), migración a Atlas, replica set con transacciones, tablero en Power BI y recordatorios de vacunas por WhatsApp.
