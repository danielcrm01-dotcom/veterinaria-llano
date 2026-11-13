/**
 * crear_usuarios.js — Fase 2: usuarios de administración y de aplicación
 *
 * PASO 1 (con autenticación aún DESACTIVADA, solo la primera vez):
 *   mongosh crear_usuarios.js
 * PASO 2: activar security.authorization: enabled en mongod.cfg y reiniciar el servicio.
 *
 * Las contraseñas se piden por consola con passwordPrompt(): no quedan escritas en ningún archivo.
 */
const admin = db.getSiblingDB("admin");

// 1) Administrador: gestiona usuarios y todas las bases (SOLO para tareas de administración)
admin.createUser({
  user: "admin_mongo",
  pwd: passwordPrompt(),
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, { role: "readWriteAnyDatabase", db: "admin" },
           { role: "backup", db: "admin" }, { role: "restore", db: "admin" } ]
});

// 2) Usuario de aplicación: mínimo privilegio -> readWrite SOLO sobre veterinaria_llano
const vet = db.getSiblingDB("veterinaria_llano");
vet.createUser({
  user: "app_veterinaria",
  pwd: passwordPrompt(),
  roles: [ { role: "readWrite", db: "veterinaria_llano" } ]
});

print("Usuarios creados:");
printjson(admin.getUsers().users.map(u => u.user + " -> " + JSON.stringify(u.roles)));
printjson(vet.getUsers().users.map(u => u.user + " -> " + JSON.stringify(u.roles)));
