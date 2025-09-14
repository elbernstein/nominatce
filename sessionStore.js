const MongoStore = require('connect-mongo');
require('dotenv').config();

const password = "r7ogqjJ7XyULgrZY";
const usuario = "bernstein";
const bd = "tucajaex";
const uri = `mongodb+srv://${usuario}:${password}@cluster0.ui39vqd.mongodb.net/${bd}?retryWrites=true&w=majority&appName=Cluster0`;

// Crea el almacén de sesiones usando la URI
const sessionStore = MongoStore.create({
  mongoUrl: uri,
  collectionName: 'sessions',
  ttl: 14 * 24 * 60 * 60,
  autoRemove: 'native',
});

// Exportamos solo lo que necesita app.js
module.exports = { sessionStore, uri };