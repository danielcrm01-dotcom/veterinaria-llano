"""
crud_mascotas.py — CRUD completo sobre la colección `mascotas` con PyMongo.

La cadena de conexión se lee desde el archivo .env (no hay contraseñas en el código).
Se conecta con el usuario de aplicación (readWrite solo sobre veterinaria_llano).

Uso:  python crud_mascotas.py
"""
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError, WriteError


def conectar():
    load_dotenv()                                   # lee .env
    uri = os.getenv("MONGODB_URI")
    nombre_db = os.getenv("MONGODB_DB", "veterinaria_llano")
    if not uri:
        sys.exit("Falta MONGODB_URI en el archivo .env (copie .env.example como .env).")
    cliente = MongoClient(uri, serverSelectionTimeoutMS=5000)
    cliente.admin.command("ping")                   # falla pronto si credenciales o servidor están mal
    return cliente, cliente[nombre_db]


# ---------------------------- CREATE ----------------------------
def crear_mascota(db, propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg):
    doc = {
        "propietarioId": propietario_id,            # REFERENCIA al propietario
        "nombre": nombre, "especie": especie, "raza": raza, "sexo": sexo,
        "fechaNacimiento": fecha_nacimiento, "esterilizado": False, "pesoKg": peso_kg,
        "alergias": [],
        "historialPeso": [{"fecha": datetime.now(timezone.utc), "pesoKg": peso_kg}],  # EMBEBIDO
        "totalConsultas": 0, "activo": True,
    }
    return db.mascotas.insert_one(doc).inserted_id


# ----------------------------- READ -----------------------------
def leer_mascota(db, mascota_id):
    return db.mascotas.find_one({"_id": mascota_id})


def listar_por_especie(db, especie, limite=5):
    return list(db.mascotas.find({"especie": especie}, {"nombre": 1, "raza": 1, "pesoKg": 1}).sort("nombre", 1).limit(limite))


# ---------------------------- UPDATE ----------------------------
def actualizar_peso(db, mascota_id, nuevo_peso):
    return db.mascotas.update_one(
        {"_id": mascota_id},
        {"$set": {"pesoKg": nuevo_peso},
         "$push": {"historialPeso": {"fecha": datetime.now(timezone.utc), "pesoKg": nuevo_peso}}},
    ).modified_count


# ---------------------------- DELETE ----------------------------
def eliminar_mascota(db, mascota_id):
    return db.mascotas.delete_one({"_id": mascota_id}).deleted_count


def main():
    try:
        cliente, db = conectar()
    except PyMongoError as e:
        sys.exit(f"No se pudo conectar a MongoDB: {e}")

    print(f"Conectado a la base '{db.name}' como usuario de aplicación.\n")
    propietario = db.propietarios.find_one()
    if propietario is None:
        sys.exit("No hay propietarios: ejecute primero datos_iniciales.js")

    # C
    nuevo_id = crear_mascota(db, propietario["_id"], "Firulais Demo", "perro", "Criollo", "macho",
                             datetime(2025, 5, 1, tzinfo=timezone.utc), 12.5)
    print("1) CREATE  -> _id:", nuevo_id)

    # R
    print("2) READ    ->", leer_mascota(db, nuevo_id)["nombre"])
    print("   Perros (máx. 5):", [m["nombre"] for m in listar_por_especie(db, "perro")])

    # U
    print("3) UPDATE  -> documentos modificados:", actualizar_peso(db, nuevo_id, 13.1))
    print("   historialPeso:", len(leer_mascota(db, nuevo_id)["historialPeso"]), "registros")

    # Prueba de validación $jsonSchema desde código
    try:
        db.mascotas.insert_one({"nombre": "Inválida", "especie": "dinosaurio", "pesoKg": -1})
    except WriteError as e:
        print("   Validación $jsonSchema rechazó un documento inválido (código", e.code, ")")

    # D
    print("4) DELETE  -> documentos eliminados:", eliminar_mascota(db, nuevo_id))
    print("   ¿Sigue existiendo?", leer_mascota(db, nuevo_id) is not None)
    cliente.close()


if __name__ == "__main__":
    main()
