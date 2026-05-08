const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// CONFIGURACIÓN: Pon tu usuario de TikTok aquí
let USERNAME = "Richix_16"; 
let tiktokConn = new WebcastPushConnection(USERNAME);

// Comenta estas líneas para que no den error si no estás en vivo
/*
tiktokConn.connect().then(() => {
    console.log(`✅ Conectado al Live de ${USERNAME}`);
}).catch(err => console.error("❌ Error de conexión:", err));
*/

// Agrega esto justo debajo para probar manualmente desde la terminal
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("⌨️ Escribe el nombre de un regalo (ej: Rosa) y presiona Enter para probar:");

rl.on('line', (input) => {
    console.log(`Simulando regalo: ${input}`);
    io.emit('show-alert', { gift: input });
});
//

// Escuchar regalos
tiktokConn.on('gift', (data) => {
    // Solo nos interesa el regalo si no es repetido muy rápido (opcional)
    console.log(`Regalo recibido: ${data.giftName}`);
    
    // Enviamos el nombre del regalo a la página web
    io.emit('show-alert', { gift: data.giftName });
});

server.listen(3000, () => {
    console.log("🚀 Servidor corriendo en http://localhost:3000");
});