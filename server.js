const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);

// 1. CAMBIO IMPORTANTE: Configurar CORS para que GitHub Pages pueda conectarse
const io = new Server(server, {
    cors: {
        origin: "*", // Permite que cualquier origen (como tu GitHub) se conecte
        methods: ["GET", "POST"],
        allowedHeaders: ["my-cusom-header"],
        credentials: true
    }
});

app.use(express.static('public'));

let USERNAME = "Richix_16"; 
let tiktokConn = new WebcastPushConnection(USERNAME);

// Comenta estas líneas para que no den error si no estás en vivo
/*
tiktokConn.connect().then(() => {

    console.log(`✅ Conectado al Live de ${USERNAME}`);

}).catch(err => console.error("❌ Error de conexión:", err));
*/

//esto es para pruebas locales
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("⌨️ Escribe el nombre de un regalo (ej: Rosa) y presiona Enter para probar:");

rl.on('line', (input) => {
    console.log(`Simulando regalo: ${input}`);
    io.emit('show-alert', { gift: input });
});
//hasta aqui


tiktokConn.on('gift', (data) => {
    console.log(`Regalo recibido: ${data.giftName}`);
    io.emit('show-alert', { gift: data.giftName });
});

// 2. CAMBIO DE PUERTO: Usamos el puerto 80 para que la URL sea más sencilla
// Recuerda abrir la terminal como Administrador para usar este puerto
server.listen(80, () => {
    console.log("🚀 Servidor corriendo en el perto 80");
    console.log("📡 Esperando conexiones desde GitHub Pages...");
});