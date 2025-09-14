// ===============================================
// IMPORTACIÓN DE MÓDULOS Y MODELOS
// ===============================================
const Sector = require('../models/nomina/Sector');
const Feriado = require('../models/nomina/Feriado');
const Cargos = require('../models/nomina/Cargos');
const Pais = require('../models/nomina/Pais');      
const Moneda = require('../models/nomina/Moneda');   
const Empleado = require('../models/nomina/Empleado');
const User = require('../models/Users'); 
const Contrato = require('../models/nomina/Contrato');
const HorarioPlantilla = require('../models/nomina/HorarioPlantilla');

const Marcaje = require('../models/nomina/Marcaje');
const csv = require('csv-parser');
const { Readable } = require('stream');

const TimesheetDia = require('../models/nomina/TimesheetDia');
const { construirTimesheetEmpleado } = require('../services/nomina/calculadoraNomina');


const nominaCtrl = {};

// ===============================================
// CONTROLADORES DE VISTAS PRINCIPALES
// ===============================================

/**
 * Renderiza el Dashboard Principal con las tarjetas de navegación a los módulos.
 * Corresponde a la ruta GET /nomina
 */
nominaCtrl.viewDashboardPrincipal = (req, res) => {
    res.render('nomina/dashboard_principal', {
        titulo: 'Módulo de Nómina'
    });
};

/**
 * Carga TODOS los datos necesarios para la sección de "Configuración Base"
 * y renderiza el dashboard con las pestañas de Sectores, Cargos y Feriados.
 * Corresponde a la ruta GET /nomina/configuracion
 */
// Reemplaza la función viewConfiguracion existente por esta
nominaCtrl.viewConfiguracion = async (req, res) => {
    try {
        // CORRECCIÓN: La variable se llama 'horarioPlantillas' (plural) para que coincida con lo que se pasa abajo
        const [sectores, cargos, feriados, paises, monedas, horarioPlantillas] = await Promise.all([
            Sector.find({}).lean(),
            Cargos.find().lean(),
            Feriado.find().populate('sector').sort({ fecha: -1 }).lean(),
            Pais.find().sort({ nombre: 1 }).lean(),
            Moneda.find().sort({ nombre: 1 }).lean(),
            HorarioPlantilla.find({ activo: true }).lean()
        ]);

        res.render('nomina/dashboard_configuracion', {
            sectores, 
            cargos, 
            feriados, 
            paises, 
            monedas,
            horarioPlantillas, // <-- Ahora esta variable SÍ existe
            titulo: 'Configuración Base de Nómina'
        });

    } catch (error) {
        console.error("Error al cargar la página de configuración:", error);
        res.status(500).send("Error al cargar los datos de configuración.");
    }
};

// ===============================================
// FUNCIONES CRUD PARA "CONFIGURACIÓN BASE"
// ===============================================

// --- SECTORES ---
// Reemplaza la función crearSector existente por esta
nominaCtrl.crearSector = async (req, res) => {
    try {
        // El middleware 'urlencoded' de Express convierte los campos del formulario
        // como "reglas_horas[horas_jornada_diaria]" en un objeto anidado req.body.reglas_horas
        
        const {
            nombre_comercial,
            razon_social,
            pais_iso2,
            moneda_iso3,
            timezone,
            reglas_horas, // Este es un objeto
            reglas_penalizaciones // Este es otro objeto
        } = req.body;

        const nuevoSector = new Sector({
            nombre_comercial,
            razon_social,
            pais_iso2,
            moneda_iso3,
            timezone,
            reglas_horas: {
                horas_jornada_diaria: reglas_horas.horas_jornada_diaria,
                horas_jornada_semanal: reglas_horas.horas_jornada_semanal,
                nocturnidad_inicio: reglas_horas.nocturnidad_inicio,
                nocturnidad_fin: reglas_horas.nocturnidad_fin,
                extra_diurna: reglas_horas.extra_diurna,
                extra_nocturna: reglas_horas.extra_nocturna,
                extra_festiva: reglas_horas.extra_festiva
            },
            reglas_penalizaciones: {
                tolerancia_minutos: reglas_penalizaciones.tolerancia_minutos,
                tardanza_descuento_por_minuto: reglas_penalizaciones.tardanza_descuento_por_minuto,
                falta_injustificada_descuento_dias: reglas_penalizaciones.falta_injustificada_descuento_dias
            }
        });

        await nuevoSector.save();
        
    } catch (error) {
        console.error("Error al crear el sector:", error);
    }
    res.redirect('/nomina/configuracion#tab_sectores');
};

// --- CARGOS ---
nominaCtrl.crearCargo = async (req, res) => {
    try {
        const nuevoCargo = new Cargos(req.body);
        await nuevoCargo.save();
    } catch (error) {
        console.error("Error al crear el cargo:", error);
    }
    res.redirect('/nomina/configuracion#tab_cargos');
};

nominaCtrl.editarCargo = async (req, res) => {
    try {
        await Cargos.findByIdAndUpdate(req.params.id, req.body);
    } catch (error) {
        console.error("Error al editar el cargo:", error);
    }
    res.redirect('/nomina/configuracion#tab_cargos');
};

nominaCtrl.eliminarCargo = async (req, res) => {
    try {
        await Cargos.findByIdAndDelete(req.params.id);
    } catch (error) {
        console.error("Error al eliminar el cargo:", error);
    }
    res.redirect('/nomina/configuracion#tab_cargos');
};

// --- FERIADOS ---
nominaCtrl.crearFeriado = async (req, res) => {
    try {
        const nuevoFeriado = new Feriado(req.body);
        await nuevoFeriado.save();
    } catch (error) {
        console.error("Error al crear el feriado:", error);
    }
    res.redirect('/nomina/configuracion#tab_feriados');
};

nominaCtrl.eliminarFeriado = async (req, res) => {
    try {
        await Feriado.findByIdAndDelete(req.params.id);
    } catch (error) {
        console.error("Error al eliminar el feriado:", error);
    }
    res.redirect('/nomina/configuracion#tab_feriados');
};

// --- PAÍSES Y MONEDAS (NUEVAS FUNCIONES) ---
nominaCtrl.crearPais = async (req, res) => {
    try {
        const { nombre, iso2 } = req.body;
        // Validación para evitar duplicados
        const existe = await Pais.findOne({ $or: [{ nombre }, { iso2 }] });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El país o código ISO ya existe.' });
        }
        const nuevoPais = new Pais({ nombre, iso2 });
        await nuevoPais.save();
        res.status(201).json({ success: true, pais: nuevoPais });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

nominaCtrl.crearMoneda = async (req, res) => {
    try {
        const { nombre, iso3 } = req.body;
        // Validación para evitar duplicados
        const existe = await Moneda.findOne({ $or: [{ nombre }, { iso3 }] });
        if (existe) {
            return res.status(409).json({ success: false, message: 'La moneda o código ISO ya existe.' });
        }
        const nuevaMoneda = new Moneda({ nombre, iso3 });
        await nuevaMoneda.save();
        res.status(201).json({ success: true, moneda: nuevaMoneda });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

nominaCtrl.getSectorJSON = async (req, res) => {
    try {
        const sector = await Sector.findById(req.params.id);
        if (!sector) {
            return res.status(404).json({ success: false, message: 'Sector no encontrado' });
        }
        res.json({ success: true, sector: sector });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Actualiza la información de un sector existente.
 */
nominaCtrl.editarSector = async (req, res) => {
    try {
        // req.body ya viene con la estructura anidada correcta (reglas_horas, etc.)
        await Sector.findByIdAndUpdate(req.params.id, req.body);
    } catch (error) {
        console.error("Error al editar el sector:", error);
    }
    res.redirect('/nomina/configuracion#tab_sectores');
};

/**
 * Cambia el estado 'activo' de un sector (borrado suave).
 */
nominaCtrl.alternarEstadoSector = async (req, res) => {
    try {
        const sector = await Sector.findById(req.params.id);
        if (sector) {
            sector.activo = !sector.activo; // Invierte el valor booleano
            await sector.save();
        }
    } catch (error) {
        console.error("Error al cambiar estado del sector:", error);
    }
    res.redirect('/nomina/configuracion#tab_sectores');
};

// Reemplaza la función viewPersonal existente por esta VERSIÓN DE DEPURACIÓN
nominaCtrl.viewPersonal = async (req, res) => {
    try {
        const [empleados, sectores, cargos, usuarios, contratos] = await Promise.all([
            Empleado.find({}).populate('sector cargo').lean(),
            Sector.find({ activo: true }).sort({ nombre_comercial: 1 }).lean(),
            Cargos.find({ activo: true }).sort({ nombre: 1 }).lean(),
            User.find({ activo: true }).select('name correo').sort({ name: 1 }).lean(),
            Contrato.find().lean() // <-- AÑADIDO: Carga los contratos maestros
        ]);

        res.render('nomina/dashboard_personal', {
            empleados,
            sectores,
            cargos,
            usuarios,
            contratos, // <-- AÑADIDO: Pasa los contratos a la vista
            titulo: 'Gestión de Personal'
        });
    } catch (error) {
        console.error("Error al cargar la página de personal:", error);
        res.status(500).send("Error al cargar los datos del personal.");
    }
};


// Reemplaza la función 'crearCargo' por 'crearEmpleado' si usaste mi código anterior. Si no, añádela.
nominaCtrl.crearEmpleado = async (req, res) => {
    try {
        const datosEmpleado = req.body;
        if (!datosEmpleado.usuario || datosEmpleado.usuario === "") {
            delete datosEmpleado.usuario;
        }
        const nuevoEmpleado = new Empleado(datosEmpleado);
        await nuevoEmpleado.save();
    } catch (error) {
        console.error("Error al crear el empleado:", error);
    }
    res.redirect('/nomina/personal');
};

// Reemplaza la función viewDetalleEmpleado
nominaCtrl.viewDetalleEmpleado = async (req, res) => {
    try {
        // Añadimos la consulta de 'HorarioPlantilla'
        const [empleado, usuarios, cargos, sectores, horarioPlantillas] = await Promise.all([
            Empleado.findById(req.params.id).populate('sector cargo usuario horario_plantilla').lean(),
            User.find({ activo: true }).select('name correo').lean(),
            Cargos.find({ activo: true }).lean(),
            Sector.find({ activo: true }).lean(),
            HorarioPlantilla.find({ activo: true }).lean() // <-- LÍNEA AÑADIDA
        ]);

        if (!empleado) {
            return res.redirect('/nomina/personal');
        }

        res.render('nomina/detalle_empleado', {
            empleado,
            usuarios,
            cargos,
            sectores,
            horarioPlantillas, // <-- PASAMOS LA VARIABLE A LA VISTA
            titulo: `Expediente de ${empleado.nombres} ${empleado.apellidos}`
        });

    } catch (error) {
        console.error("Error al cargar el detalle del empleado:", error);
        res.redirect('/nomina/personal');
    }
};

// Procesa el formulario para EDITAR un empleado
nominaCtrl.editarEmpleado = async (req, res) => {
    const { id } = req.params;
    try {
        const datosAActualizar = req.body;
        
        if (!datosAActualizar.usuario || datosAActualizar.usuario === "") {
            delete datosAActualizar.usuario;
            await Empleado.findByIdAndUpdate(id, { $set: datosAActualizar, $unset: { usuario: 1 } });
        } else {
            await Empleado.findByIdAndUpdate(id, datosAActualizar);
        }
    } catch (error) {
        console.error("Error al editar el empleado:", error);
    }
    res.redirect(`/nomina/personal/${id}`);
};

// Muestra la página principal del gestor de contratos
nominaCtrl.viewContratos = async (req, res) => {
    try {
        const contratos = await Contrato.find().lean();
        // (Más adelante, calcularemos el número de empleados por contrato)
        res.render('nomina/dashboard_contratos', {
            contratos,
            titulo: 'Gestión de Contratos'
        });
    } catch (error) {
        console.error("Error al cargar la página de contratos:", error);
        res.status(500).send("Error al cargar los datos.");
    }
};
// Reemplaza la función crearContrato existente por esta
nominaCtrl.crearContrato = async (req, res) => {
    try {
        const datosContrato = req.body;
        // Marcamos este contrato como una plantilla "Maestra"
        datosContrato.esMaestro = true; 
        
        const nuevoContrato = new Contrato(datosContrato);
        await nuevoContrato.save();
    } catch (error) {
        console.error("Error al crear el contrato maestro:", error);
    }
    res.redirect('/nomina/personal#tab_contratos'); 
};

// Muestra la página de detalle para un contrato (para asignar empleados)
nominaCtrl.viewDetalleContrato = async (req, res) => {
    try {
        const contrato = await Contrato.findById(req.params.id).lean();
        if (!contrato) {
            return res.redirect('/nomina/contratos');
        }

        // Buscamos empleados CON y SIN este contrato
        const [empleadosAsignados, empleadosSinAsignar] = await Promise.all([
            Empleado.find({ contrato: req.params.id }).lean(),
            Empleado.find({ $or: [{ contrato: { $ne: req.params.id } }, { contrato: { $exists: false } }] }).lean()
        ]);

        res.render('nomina/detalle_contrato', {
            contrato,
            empleadosAsignados,
            empleadosSinAsignar,
            titulo: `Detalle de Contrato: ${contrato.tipo}`
        });

    } catch (error) {
        console.error("Error al cargar detalle de contrato:", error);
        res.redirect('/nomina/contratos');
    }
};

// Verifica que tu función se vea así:
nominaCtrl.asignarEmpleadosAContrato = async (req, res) => {
    const { id } = req.params; // ID del Contrato Maestro
    
    // El 'name' del <select> es "empleados_asignados", así que lo buscamos en el body.
    // Si no se selecciona ningún empleado, llegará como 'undefined'.
    const empleadosIds = req.body.empleados_asignados || [];

    try {
        // PRIMERO: Quitamos este contrato a cualquier empleado que lo tuviera antes.
        // Esto previene inconsistencias.
        await Empleado.updateMany(
            { contrato: id },
            { $unset: { contrato: 1 } }
        );
        
        // SEGUNDO: Asignamos el contrato a la nueva lista de empleados seleccionados.
        if (empleadosIds.length > 0) {
            await Empleado.updateMany(
                { _id: { $in: empleadosIds } },
                { $set: { contrato: id } }
            );
        }
    } catch (error) {
        console.error("Error al asignar empleados a contrato:", error);
    }
    // Redirigimos de vuelta a la misma página para ver los cambios
    res.redirect(`/nomina/contratos/${id}`);
};

nominaCtrl.crearHorarioPlantilla = async (req, res) => {
    try {
        // req.body contendrá el nombre_plantilla y los turnos
        const nuevaPlantilla = new HorarioPlantilla(req.body);
        await nuevaPlantilla.save();
    } catch (error) {
        console.error("Error al crear la plantilla de horario:", error);
    }
    res.redirect('/nomina/configuracion#tab_horarios'); 
};

// Añade esta nueva función
nominaCtrl.crearHorarioPlantilla = async (req, res) => {
    try {
        const datos = req.body;

        // El formulario envía los 7 días. Filtramos solo los que tengan
        // un 'inicio' y 'fin' definidos para no guardar días vacíos.
        const turnosValidos = datos.turnos.filter(turno => turno.inicio && turno.fin);
        datos.turnos = turnosValidos;

        const nuevaPlantilla = new HorarioPlantilla(datos);
        await nuevaPlantilla.save();
    } catch (error) {
        console.error("Error al crear la plantilla de horario:", error);
    }
    // Redirige de vuelta a la página de configuración, a la nueva pestaña de horarios.
    res.redirect('/nomina/configuracion#tab_horarios'); 
};

// Añade esta nueva función
nominaCtrl.guardarHorarioPersonalizado = async (req, res) => {
    const { id } = req.params;
    const { turnos } = req.body;

    try {
        const turnosValidos = turnos.filter(t => t.inicio && t.fin);

        await Empleado.findByIdAndUpdate(id, {
            $set: { horario_personalizado: turnosValidos }, // Guarda el horario personalizado
            $unset: { horario_plantilla: 1 } // IMPORTANTE: Desvincula cualquier plantilla
        });

    } catch (error) {
        console.error("Error al guardar horario personalizado:", error);
    }
    res.redirect(`/nomina/personal/${id}#tab_horarios`);
};

// Muestra la página principal de Tiempo y Asistencia
nominaCtrl.viewAsistencia = async (req, res) => {
    try {
        const empleados = await Empleado.find({ estado: 'ACTIVO' }).sort({ nombres: 1 }).lean();
        // También obtenemos los últimos 10 marcajes para mostrarlos en una tabla de actividad reciente
        const marcajesRecientes = await Marcaje.find({})
            .populate('empleado')
            .sort({ ts: -1 })
            .limit(10)
            .lean();

        res.render('nomina/dashboard_asistencia', {
            empleados,
            marcajesRecientes,
            titulo: 'Tiempo y Asistencia'
        });
    } catch (error) {
        console.error("Error al cargar la página de asistencia:", error);
        res.status(500).send("Error al cargar los datos.");
    }
};

// Crea un único marcaje desde el formulario manual
nominaCtrl.crearMarcajeManual = async (req, res) => {
    try {
        // El 'name' del input de fecha y hora será 'ts'
        const nuevoMarcaje = new Marcaje(req.body);
        await nuevoMarcaje.save();
    } catch (error) {
        console.error("Error al crear marcaje manual:", error);
    }
    res.redirect('/nomina/asistencia');
};

// Procesa el archivo CSV
nominaCtrl.cargarMarcajesCSV = async (req, res) => {
    if (!req.file || !req.file.buffer) {
        // req.flash('error', 'No se subió ningún archivo.');
        return res.redirect('/nomina/asistencia');
    }

    const marcajesParaGuardar = [];
    const buffer = req.file.buffer;

    // Convertimos el buffer del archivo en un stream legible
    const readableStream = Readable.from(buffer.toString('utf8'));

    // Usamos 'csv-parser' para leer el stream línea por línea
    readableStream
        .pipe(csv({ mapHeaders: ({ header }) => header.toLowerCase().trim() }))
        .on('data', (row) => {
            // Asumimos que el CSV tiene las columnas: 'documento', 'timestamp', 'tipo'
            // El 'timestamp' debe ser un formato que JS pueda interpretar, como "2025-10-23T08:00:00"
            if (row.documento && row.timestamp && row.tipo) {
                marcajesParaGuardar.push({
                    documento: row.documento,
                    ts: new Date(row.timestamp),
                    tipo: row.tipo.toUpperCase().startsWith('IN') ? 'IN' : 'OUT',
                    fuente: 'MANUAL' // O 'BIOMETRICO' si quieres diferenciar
                });
            }
        })
        .on('end', async () => {
            if (marcajesParaGuardar.length === 0) {
                // req.flash('info', 'El archivo estaba vacío o no tenía el formato correcto.');
                return res.redirect('/nomina/asistencia');
            }
            
            try {
                // Buscamos los IDs de todos los empleados basándonos en los documentos del CSV
                const documentos = [...new Set(marcajesParaGuardar.map(m => m.documento))];
                const empleados = await Empleado.find({ documento: { $in: documentos } }).select('_id documento');
                const mapaEmpleados = new Map(empleados.map(e => [e.documento, e._id]));
                
                // Convertimos los marcajes para que usen el ObjectId del empleado en lugar del documento
                const marcajesFinales = marcajesParaGuardar
                    .filter(m => mapaEmpleados.has(m.documento)) // Ignoramos marcajes de empleados no encontrados
                    .map(m => ({
                        empleado: mapaEmpleados.get(m.documento),
                        ts: m.ts,
                        tipo: m.tipo,
                        fuente: m.fuente
                    }));

                if (marcajesFinales.length > 0) {
                    await Marcaje.insertMany(marcajesFinales, { ordered: false });
                }
                
                // req.flash('success', `${marcajesFinales.length} marcajes importados correctamente.`);
                res.redirect('/nomina/asistencia');
            } catch (error) {
                console.error("Error guardando marcajes desde CSV:", error);
                // req.flash('error', 'Error al guardar los marcajes en la base de datos.');
                res.redirect('/nomina/asistencia');
            }
        });
};
// Genera y envía un archivo CSV de ejemplo como plantilla.
// Reemplaza la función descargarPlantillaCSV por esta versión
nominaCtrl.descargarPlantillaCSV = (req, res) => {
    // Definimos el contenido en un formato de array de arrays para mayor claridad
    const filas = [
        // Fila de cabeceras
        ['documento', 'timestamp', 'tipo'],
        // Filas de ejemplo
        ['12345678', '2025-10-23T08:00:00', 'IN'],
        ['12345678', '2025-10-23T17:30:00', 'OUT'],
        ['87654321', '2025-10-23T09:00:00', 'IN']
    ];

    // Convertimos el array de arrays en una cadena de texto CSV bien formada
    // Cada elemento se encierra en comillas dobles y se separa por comas.
    // Cada fila termina con un salto de línea (\n).
    const contenidoCSV = filas.map(fila => 
        fila.map(item => `"${item}"`).join(',')
    ).join('\n');

    // Configuramos las cabeceras de la respuesta HTTP para forzar la descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); // Especificamos UTF-8
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_marcajes.csv');
    
    // Enviamos el contenido y finalizamos la respuesta
    res.status(200).end(contenidoCSV);
};

nominaCtrl.viewTimesheet = async (req, res) => {
    const { empleadoId, fecha_inicio, fecha_fin } = req.query;
    let timesheets = [];

    try {
        const empleados = await Empleado.find({ estado: 'ACTIVO' }).sort({ nombres: 1 }).lean();

        if (empleadoId && fecha_inicio && fecha_fin) {
            // Si hay filtros, procesamos los datos
            const empleado = empleados.find(e => e._id.toString() === empleadoId);
            const sector = await Sector.findById(empleado.sector).lean();
            const horario = await HorarioPlantilla.findById(empleado.horario_plantilla).lean();
            
            // Un "periodo" temporal solo para los cálculos
            const periodoSimulado = {
                inicio: new Date(fecha_inicio),
                fin: new Date(fecha_fin)
            };

            if (empleado && sector && horario) {
                // Esta es la llamada clave al motor de cálculo
                await construirTimesheetEmpleado(empleado, periodoSimulado, horario, sector);
            }
            
            // Una vez procesado, buscamos los resultados para mostrarlos
            timesheets = await TimesheetDia.find({
                empleado: empleadoId,
                fecha_local: { $gte: fecha_inicio, $lte: fecha_fin }
            }).sort({ fecha_local: 1 }).lean();
        }

        res.render('nomina/timesheet_auditoria', {
            empleados,
            timesheets,
            filtros: req.query, // Para recordar los valores en los campos del formulario
            titulo: 'Auditoría de Timesheet'
        });
    } catch (error) {
        console.error("Error al cargar la página de timesheet:", error);
        res.status(500).send("Error al procesar el timesheet.");
    }
};

module.exports = nominaCtrl;