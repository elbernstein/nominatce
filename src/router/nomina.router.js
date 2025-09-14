// src/router/nomina.router.js
const router = require('express').Router();
const nominaCtrl = require('../controlls/nomina.controller');

// RUTA 1: El Dashboard Principal con las tarjetas grandes
router.get('/nomina', nominaCtrl.viewDashboardPrincipal);

// RUTA 2: La página de Configuración con sus pestañas internas
router.get('/nomina/configuracion', nominaCtrl.viewConfiguracion);

router.post('/nomina/horario-plantilla', nominaCtrl.crearHorarioPlantilla);


// --- Rutas de acciones (CRUD) ---
router.post('/nomina/sector', nominaCtrl.crearSector);
router.post('/nomina/cargo', nominaCtrl.crearCargo);
router.post('/nomina/cargo/editar/:id', nominaCtrl.editarCargo);
router.get('/nomina/cargo/eliminar/:id', nominaCtrl.eliminarCargo);
router.post('/nomina/feriado', nominaCtrl.crearFeriado);
router.get('/nomina/feriado/eliminar/:id', nominaCtrl.eliminarFeriado);
router.post('/nomina/pais', nominaCtrl.crearPais);
router.post('/nomina/moneda', nominaCtrl.crearMoneda);

// RUTAS PARA EDITAR Y BORRAR SUAVEMENTE LOS SECTORES
router.get('/nomina/sector/:id', nominaCtrl.getSectorJSON); // Devuelve los datos de un sector para el modal de edición
router.post('/nomina/sector/editar/:id', nominaCtrl.editarSector);
router.get('/nomina/sector/alternar-estado/:id', nominaCtrl.alternarEstadoSector);

// =======================================================
// RUTAS PARA GESTIÓN DE PERSONAL
// =======================================================
// =======================================================
// RUTAS PARA GESTIÓN DE PERSONAL (CORREGIDO)
// =======================================================
// Muestra el dashboard de personal con pestañas (Empleados y Contratos)
router.get('/nomina/personal', nominaCtrl.viewPersonal); 

// Procesa la creación de un nuevo empleado
router.post('/nomina/empleado', nominaCtrl.crearEmpleado);

// Procesa la creación de un nuevo contrato maestro
router.post('/nomina/contrato', nominaCtrl.crearContrato); // La redirección nos llevará a la pestaña correcta
// ... (tus otras rutas)
// Nueva ruta para guardar un horario personalizado
router.post('/nomina/personal/:id/horario-personalizado', nominaCtrl.guardarHorarioPersonalizado);

// Muestra la página de detalle/expediente de un empleado específico
router.get('/nomina/personal/:id', nominaCtrl.viewDetalleEmpleado);

// Procesa la actualización de los datos de un empleado
router.post('/nomina/personal/editar/:id', nominaCtrl.editarEmpleado);

// =======================================================
// RUTAS PARA EL CENTRO DE GESTIÓN DE CONTRATOS
// =======================================================
// Muestra la tabla de todos los contratos maestros
router.get('/nomina/contratos', nominaCtrl.viewContratos);
// Procesa la creación de un nuevo contrato maestro
router.post('/nomina/contrato', nominaCtrl.crearContrato);
// Muestra la página de detalle/asignación de un contrato maestro
router.get('/nomina/contratos/:id', nominaCtrl.viewDetalleContrato);
// Procesa la actualización de los empleados asignados a un contrato
router.post('/nomina/contratos/:id/asignar', nominaCtrl.asignarEmpleadosAContrato);


// =======================================================
// RUTAS PARA TIEMPO Y ASISTENCIA
// =======================================================
// Muestra la página de gestión de marcajes
router.get('/nomina/asistencia', nominaCtrl.viewAsistencia);

// Procesa el formulario de un marcaje manual
router.post('/nomina/marcaje-manual', nominaCtrl.crearMarcajeManual);

// Procesa la subida de un archivo CSV con marcajes masivos
// (Necesitaremos 'multer' para manejar la subida del archivo)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Guardamos el archivo en memoria para procesarlo
router.post('/nomina/marcajes-csv', upload.single('archivo_csv'), nominaCtrl.cargarMarcajesCSV);
// ... (debajo de las otras rutas de asistencia)
router.get('/nomina/asistencia/plantilla-csv', nominaCtrl.descargarPlantillaCSV);
router.get('/nomina/timesheet', nominaCtrl.viewTimesheet);

module.exports = router;