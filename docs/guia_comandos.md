# Guía de comandos para las evidencias (capturas)

Tome una captura por cada punto marcado con 📸 y péguela en el documento de diseño (Fase 2) o en la carpeta `evidencias/`.

## 1. Instalación y autenticación (Fase 2)

1. 📸 Versión instalada: `mongod --version` y `mongosh --version`.
2. Crear usuarios (autenticación todavía apagada): `mongosh crear_usuarios.js`
3. 📸 Archivo **mongod.cfg** abierto mostrando:
   ```
   security:
     authorization: enabled
   ```
   (Windows: `C:\Program Files\MongoDB\Server\<versión>\bin\mongod.cfg`; abrir el Bloc de notas como administrador.)
4. Reiniciar el servicio (PowerShell como administrador): `net stop MongoDB` y luego `net start MongoDB`
5. 📸 Prueba de que **sin usuario no deja trabajar**:
   ```
   mongosh
   > use veterinaria_llano
   > db.mascotas.find()        // debe responder "requires authentication"
   ```
6. 📸 **Conexión con el usuario de aplicación:**
   ```
   mongosh "mongodb://app_veterinaria@localhost:27017/veterinaria_llano?authSource=veterinaria_llano"
   > db.runCommand({connectionStatus: 1})     // muestra el usuario y el rol readWrite
   ```
7. 📸 Prueba de mínimo privilegio (debe fallar): `use admin` → `db.getUsers()` con el usuario de aplicación.

## 2. Implementación (Fase 3)

1. Cargar datos (comando del README, paso 4).
2. 📸 La salida del script: conteos por colección y la línea **"documento rechazado: DocumentValidationFailure"**.
3. 📸 En mongosh: `db.mascotas.countDocuments()` y `db.mascotas.findOne()` (se ve el historialPeso embebido).

## 3. Consultas e índices (Fase 4)

1. Ejecutar `consultas.js` (README, paso 5).
2. 📸 Salidas de las partes A, B y C.
3. 📸 La parte D: las líneas **ANTES** (`COLLSCAN`) y **DESPUÉS** (`IXSCAN`) de cada índice. Interprételas en el documento:
   con el índice, `docsExaminados` baja de ~16–30 a solo los documentos necesarios, y la etapa cambia de `COLLSCAN` a `IXSCAN`.
   Aunque la diferencia en milisegundos sea pequeña con pocos datos, en producción (miles de consultas) el índice evita leer toda la colección.

## 4. Respaldo y restauración (Fase 5)

```
:: Respaldo (crea la carpeta respaldo/)
mongodump --uri="mongodb://admin_mongo@localhost:27017/?authSource=admin" --db=veterinaria_llano --out=respaldo

:: 📸 Simular un desastre: borrar la base
mongosh "mongodb://admin_mongo@localhost:27017/admin" --eval "db.getSiblingDB('veterinaria_llano').dropDatabase()"

:: Restaurar
mongorestore --uri="mongodb://admin_mongo@localhost:27017/?authSource=admin" --nsInclude="veterinaria_llano.*" respaldo

:: 📸 Verificar que volvieron los datos
mongosh "mongodb://app_veterinaria@localhost:27017/veterinaria_llano?authSource=veterinaria_llano" --eval "db.mascotas.countDocuments()"
```
`mongodump` y `mongorestore` se instalan aparte (MongoDB Database Tools); si el comando no existe, descargue el paquete desde la página de MongoDB.
Comprima la carpeta `respaldo/` en un `.zip` para el entregable.

## 5. Programa Python

1. 📸 `python crud_mascotas.py` mostrando los 4 pasos CREATE / READ / UPDATE / DELETE.
2. 📸 El archivo `.env` abierto (sin mostrar la contraseña real) y el código sin contraseñas.

## 6. Entrega

- Subir el repositorio a GitHub **sin** `.env`.
- Armar `BD2_NoSQL_Grupo#_Proyecto.zip` con: PDF de diseño, `datos_iniciales.js`, `consultas.js`, `crud_mascotas.py`, zip del respaldo y enlace al repositorio. Subirlo a Q10.
