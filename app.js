// ===============================================
// IMPORTACIÓN DE MÓDULOS
// ===============================================
const express = require('express');
const http = require('http');
const session = require('express-session');
const flash = require('express-flash');
const morgan = require('morgan');
const cors = require('cors');
const methodOverride = require('method-override');
const compression = require('compression');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose'); // <-- Importante para la conexión principal
require('dotenv').config();

// ===============================================
// INICIALIZACIÓN Y CONFIGURACIÓN DE CONEXIÓN
// ===============================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
const puerto = process.env.PORT || 3033;

// --- Configuración de Conexión a MongoDB Atlas ---
const password = "r7ogqjJ7XyULgrZY";
const usuario = "bernstein";
const bd = "tucajaex";
const uri = `mongodb+srv://${usuario}:${password}@cluster0.ui39vqd.mongodb.net/${bd}?retryWrites=true&w=majority&appName=Cluster0`;

// Conectamos Mongoose a la base de datos de Atlas
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Conexión principal a MongoDB (Atlas) exitosa.'))
  .catch(err => console.error('❌ Error en la conexión principal a MongoDB:', err));

const MongoStore = require('connect-mongo');
const sessionStore = MongoStore.create({
    mongoUrl: uri, // Reutilizamos la misma URI para las sesiones
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native',
});

// ===============================================
// CONFIGURACIÓN DEL MOTOR DE VISTAS (EJS)
// ===============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===============================================
// CONFIGURACIÓN DE MIDDLEWARES
// ===============================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Configuración de Sesiones (ahora usa el store que definimos arriba)
app.use(session({
  secret: process.env.SECRET_KEY || 'tu-clave-secreta-deberia-ser-mas-larga',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.session = req.session || {};
  req.io = io;
  next();
});

// ===============================================
// RUTAS DE LA APLICACIÓN
// ===============================================
app.use('/', require('./src/router/nomina.router'));

// ===============================================
// CONFIGURACIÓN DE SOCKET.IO
// ===============================================
io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado a Socket.IO:', socket.id);
});

// ===============================================
// ARRANQUE DEL SERVIDOR
// ===============================================
server.listen(puerto, () => {
  console.log(`🚀 Sistema de Nómina corriendo exitosamente en http://localhost:${puerto}`);
  console.log(`➡️  Accede al dashboard principal en http://localhost:${puerto}/nomina`);
});