/**
 * consultas.js — Consultas, actualizaciones, agregaciones e índices
 * Base de datos: veterinaria_llano  |  Proyecto 7: Registro de mascotas y servicios veterinarios
 *
 * Ejecución:
 *   mongosh "mongodb://app_veterinaria@localhost:27017/veterinaria_llano?authSource=veterinaria_llano" consultas.js
 * (Requiere haber ejecutado antes datos_iniciales.js)
 *
 * Cada bloque indica la pregunta de negocio que responde.
 */
db = db.getSiblingDB("veterinaria_llano");
const hoy = new Date();
const dias = n => new Date(hoy.getTime() + n * 24 * 3600 * 1000);

function titulo(t) { print("\n=============================================================\n" + t + "\n============================================================="); }
function mostrar(cursor) { cursor.forEach(d => printjson(d)); }

// ===================================================================
// PARTE A — 10 CONSULTAS (find)
// ===================================================================
titulo("PARTE A — CONSULTAS");

// Q1. ¿Qué perros grandes (más de 25 kg) no están esterilizados? -> campaña de esterilización.
// Operadores: $gt (comparación) + $and (lógico) | Proyección | Ordenamiento
print("\nQ1. Perros > 25 kg sin esterilizar");
mostrar(db.mascotas.find(
  { $and: [ { especie: "perro" }, { pesoKg: { $gt: 25 } }, { esterilizado: false } ] },
  { _id: 0, nombre: 1, raza: 1, pesoKg: 1 }
).sort({ pesoKg: -1 }));

// Q2. ¿Cuántas y cuáles son las mascotas que NO son perros (gatos, aves, conejos)? -> planear stock de insumos exóticos.
// Operadores: $in / $nin | Proyección | Ordenamiento por dos campos
print("\nQ2. Mascotas que no son perros");
mostrar(db.mascotas.find(
  { especie: { $in: ["gato", "ave", "conejo"] } },
  { _id: 0, nombre: 1, especie: 1, raza: 1 }
).sort({ especie: 1, nombre: 1 }));

// Q3. ¿Qué mascotas son alérgicas a la penicilina? -> alertar antes de recetar antibióticos.
// Búsqueda en ARREGLOS: igualdad contra un elemento del arreglo "alergias"
print("\nQ3. Mascotas con alergia registrada a la penicilina");
mostrar(db.mascotas.find({ alergias: "penicilina" }, { _id: 0, nombre: 1, especie: 1, alergias: 1 }));

// Q4. ¿Qué propietarios viven en municipios distintos a Villavicencio? -> evaluar jornadas de atención en municipios.
// Búsqueda en SUBDOCUMENTOS (notación de punto) + $ne
print("\nQ4. Propietarios fuera de Villavicencio");
mostrar(db.propietarios.find(
  { "direccion.ciudad": { $ne: "Villavicencio" } },
  { _id: 0, nombres: 1, apellidos: 1, "direccion.ciudad": 1, telefono: 1 }
).sort({ "direccion.ciudad": 1 }));

// Q5. ¿Qué consultas registraron fiebre alta (temperatura >= 39.5 °C)? -> priorizar seguimiento.
// Subdocumento "signosVitales" + $gte + ordenamiento descendente + límite
print("\nQ5. Consultas con temperatura >= 39.5 °C");
mostrar(db.consultas.find(
  { "signosVitales.temperaturaC": { $gte: 39.5 } },
  { _id: 0, fecha: 1, motivo: 1, diagnostico: 1, "signosVitales.temperaturaC": 1 }
).sort({ "signosVitales.temperaturaC": -1 }).limit(10));

// Q6. ¿Qué pacientes llegaron con vómito Y diarrea? -> detectar posibles brotes gastrointestinales.
// ARREGLOS: $all exige que estén presentes todos los síntomas indicados
print("\nQ6. Consultas con vómito y diarrea");
mostrar(db.consultas.find(
  { sintomas: { $all: ["vómito", "diarrea"] } },
  { _id: 0, fecha: 1, diagnostico: 1, sintomas: 1 }
).sort({ fecha: -1 }));

// Q7. ¿Quién recibió tratamientos largos con doxiciclina (10 días o más)? -> controlar uso prolongado de antibióticos.
// ARREGLO de subdocumentos: $elemMatch (ambas condiciones sobre el MISMO elemento)
print("\nQ7. Tratamientos con doxiciclina >= 10 días");
mostrar(db.consultas.find(
  { tratamientos: { $elemMatch: { medicamento: "Doxiciclina", duracionDias: { $gte: 10 } } } },
  { _id: 0, fecha: 1, diagnostico: 1, tratamientos: 1 }
));

// Q8. ¿Qué consultas atendió la veterinaria con tarjeta profesional TP-10458? -> revisar su carga de trabajo.
// SUBDOCUMENTO: veterinario.tarjetaProfesional
print("\nQ8. Consultas atendidas por la Dra. con TP-10458");
mostrar(db.consultas.find(
  { "veterinario.tarjetaProfesional": "TP-10458" },
  { _id: 0, fecha: 1, motivo: 1, costoCOP: 1 }
).sort({ fecha: 1 }));

// Q9. ¿Qué vacunas ya están vencidas? -> contactar a los dueños para que renueven.
// Fechas con $lt + ordenamiento ascendente (las más atrasadas primero)
print("\nQ9. Vacunas con refuerzo vencido");
mostrar(db.vacunas.find(
  { proximaDosis: { $lt: hoy } },
  { _id: 0, nombre: 1, proximaDosis: 1, mascotaId: 1 }
).sort({ proximaDosis: 1 }));

// Q10. ¿Qué consultas siguen "en control" y tienen una cita de seguimiento programada? -> agenda de la clínica.
// $exists + operadores lógicos $and/$nor | ordenamiento por fecha
print("\nQ10. Consultas en control con cita programada");
mostrar(db.consultas.find(
  { $and: [ { estado: "en_control" }, { proximoControl: { $exists: true } },
            { $nor: [ { proximoControl: null } ] } ] },
  { _id: 0, motivo: 1, estado: 1, proximoControl: 1 }
).sort({ proximoControl: 1 }));

// ===================================================================
// PARTE B — 4 ACTUALIZACIONES
// ===================================================================
titulo("PARTE B — ACTUALIZACIONES");

// U1. $set — El propietario Carlos Rincón cambió de número de celular.
print("\nU1. $set: actualizar teléfono");
printjson(db.propietarios.updateOne({ cedula: "1121850123" }, { $set: { telefono: "3105559999" } }));

// U2. $inc — Se registra una nueva consulta de "Canelo" y se suma 1 al contador de la mascota.
//     (patrón "contador calculado": evita contar consultas cada vez que se muestra la ficha)
print("\nU2. $inc: nueva consulta + contador de consultas");
const canelo = db.mascotas.findOne({ nombre: "Canelo" });
db.consultas.insertOne({
  mascotaId: canelo._id, fecha: new Date(), motivo: "Revisión posvacunal", sintomas: [],
  diagnostico: "Paciente sano", veterinario: { nombre: "Dra. Laura Patricia Rojas", tarjetaProfesional: "TP-10458" },
  signosVitales: { temperaturaC: 38.5, frecuenciaCardiaca: 96, pesoKg: canelo.pesoKg },
  tratamientos: [], costoCOP: 50000, estado: "finalizada"
});
printjson(db.mascotas.updateOne({ _id: canelo._id }, { $inc: { totalConsultas: 1 } }));

// U3. $push y $pull — Se registra un nuevo pesaje de "Mora" y se retira una alergia descartada tras pruebas.
print("\nU3. $push (nuevo peso) y $pull (alergia descartada)");
printjson(db.mascotas.updateOne({ nombre: "Mora" },
  { $push: { historialPeso: { fecha: new Date(), pesoKg: 27.4 } }, $set: { pesoKg: 27.4 } }));
printjson(db.mascotas.updateOne({ nombre: "Kira" }, { $pull: { alergias: "pulgas" } }));

// U4. Upsert — Registrar propietario nuevo SOLO si no existe; si ya existe, solo actualiza el correo.
print("\nU4. upsert: propietario nuevo");
printjson(db.propietarios.updateOne(
  { cedula: "1121999888" },
  { $set: { email: "nuevo.cliente@correo.co" },
    $setOnInsert: { nombres: "Ángela María", apellidos: "Vega Rojas", telefono: "3115557777",
                    direccion: { barrio: "Barrio Pinilla", ciudad: "Villavicencio", departamento: "Meta" },
                    fechaRegistro: new Date() } },
  { upsert: true }
));

// ===================================================================
// PARTE C — 3 AGREGACIONES
// ===================================================================
titulo("PARTE C — AGREGACIONES");

// A1. ¿Cuánto ingreso y cuántas consultas genera cada especie? -> decidir en qué especialidad invertir.
//     Usa $lookup (une consultas con mascotas) + $unwind + $group
print("\nA1. Ingresos por especie ($lookup + $unwind + $group)");
mostrar(db.consultas.aggregate([
  { $lookup: { from: "mascotas", localField: "mascotaId", foreignField: "_id", as: "mascota" } },
  { $unwind: "$mascota" },
  { $group: { _id: "$mascota.especie", consultas: { $sum: 1 }, ingresosCOP: { $sum: "$costoCOP" }, ticketPromedio: { $avg: "$costoCOP" } } },
  { $project: { _id: 0, especie: "$_id", consultas: 1, ingresosCOP: 1, ticketPromedio: { $round: ["$ticketPromedio", 0] } } },
  { $sort: { ingresosCOP: -1 } }
]));

// A2. ¿Cuáles son los 5 medicamentos más recetados y por cuántos días en promedio? -> compras a proveedores.
//     Usa $unwind sobre el arreglo "tratamientos" + $group
print("\nA2. Top 5 medicamentos ($unwind + $group)");
mostrar(db.consultas.aggregate([
  { $unwind: "$tratamientos" },
  { $group: { _id: "$tratamientos.medicamento", veces: { $sum: 1 }, duracionPromedioDias: { $avg: "$tratamientos.duracionDias" } } },
  { $project: { _id: 0, medicamento: "$_id", veces: 1, duracionPromedioDias: { $round: ["$duracionPromedioDias", 1] } } },
  { $sort: { veces: -1, medicamento: 1 } },
  { $limit: 5 }
]));

// A3. ¿A quién hay que escribirle por WhatsApp en los próximos 60 días para recordarle una vacuna?
//     Doble $lookup: vacunas -> mascotas -> propietarios (lista lista para el recordatorio).
print("\nA3. Recordatorios de vacunación a 60 días ($lookup doble)");
mostrar(db.vacunas.aggregate([
  { $match: { proximaDosis: { $gte: hoy, $lte: dias(60) } } },
  { $lookup: { from: "mascotas", localField: "mascotaId", foreignField: "_id", as: "mascota" } },
  { $unwind: "$mascota" },
  { $lookup: { from: "propietarios", localField: "mascota.propietarioId", foreignField: "_id", as: "dueno" } },
  { $unwind: "$dueno" },
  { $project: { _id: 0, mascota: "$mascota.nombre", vacuna: "$nombre", proximaDosis: 1,
                propietario: { $concat: ["$dueno.nombres", " ", "$dueno.apellidos"] }, telefono: "$dueno.telefono" } },
  { $sort: { proximaDosis: 1 } }
]));

// ===================================================================
// PARTE D — 3 ÍNDICES con explain("executionStats") ANTES y DESPUÉS
// ===================================================================
titulo("PARTE D — ÍNDICES Y RENDIMIENTO");

function resumen(etiqueta, plan) {
  const e = plan.executionStats;
  // Se busca la etapa de entrada del plan ganador (COLLSCAN o IXSCAN)
  let st = plan.queryPlanner.winningPlan, etapa = st.stage;
  while (st.inputStage) { st = st.inputStage; etapa = st.stage; }
  print("  [" + etiqueta + "] etapa=" + etapa + " | docsExaminados=" + e.totalDocsExamined +
        " | clavesExaminadas=" + e.totalKeysExamined + " | devueltos=" + e.nReturned +
        " | ms=" + e.executionTimeMillis);
}
// Limpieza previa para poder repetir la demostración
try { db.propietarios.dropIndex("idx_cedula_unico"); } catch (e) {}
try { db.consultas.dropIndex("idx_mascota_fecha"); } catch (e) {}
try { db.vacunas.dropIndex("idx_proxima_dosis"); } catch (e) {}

const unaMascota = db.mascotas.findOne({ nombre: "Rocky" })._id;

// --- Índice 1 (ÚNICO): cédula del propietario -> búsqueda en recepción y evita duplicados.
print("\nÍndice 1 — propietarios.cedula (único)");
let q1 = () => db.propietarios.find({ cedula: "40321876" }).explain("executionStats");
resumen("ANTES  ", q1());
db.propietarios.createIndex({ cedula: 1 }, { unique: true, name: "idx_cedula_unico" });
resumen("DESPUÉS", q1());
try { // prueba de unicidad: debe fallar
  db.propietarios.insertOne({ cedula: "40321876", nombres: "Duplicado", apellidos: "Prueba", telefono: "3100000000",
                              direccion: { barrio: "X", ciudad: "Villavicencio", departamento: "Meta" } });
} catch (e) { print("  Unicidad verificada: " + (e.codeName || (e.code === 121 ? "DocumentValidationFailure" : e.code === 11000 ? "DuplicateKey" : "error"))); }

// --- Índice 2 (COMPUESTO): historial clínico de una mascota, más reciente primero.
print("\nÍndice 2 — consultas {mascotaId, fecha} (compuesto)");
let q2 = () => db.consultas.find({ mascotaId: unaMascota }).sort({ fecha: -1 }).explain("executionStats");
resumen("ANTES  ", q2());
db.consultas.createIndex({ mascotaId: 1, fecha: -1 }, { name: "idx_mascota_fecha" });
resumen("DESPUÉS", q2());

// --- Índice 3 (SIMPLE): vacunas por fecha del próximo refuerzo -> recordatorios y consulta Q9/A3.
print("\nÍndice 3 — vacunas.proximaDosis");
let q3 = () => db.vacunas.find({ proximaDosis: { $lt: hoy } }).sort({ proximaDosis: 1 }).explain("executionStats");
resumen("ANTES  ", q3());
db.vacunas.createIndex({ proximaDosis: 1 }, { name: "idx_proxima_dosis" });
resumen("DESPUÉS", q3());

print("\nÍndices actuales:");
["propietarios", "consultas", "vacunas"].forEach(c => { print(" " + c + ": " + db.getCollection(c).getIndexes().map(i => i.name).join(", ")); });
