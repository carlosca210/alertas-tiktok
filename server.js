const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

let tiktokConn; // La conexión se iniciará desde el panel de control

io.on('connection', (socket) => {
    console.log('✅ Cliente conectado al socket');

    // EVENTO 1: Conectar a un usuario de TikTok desde el Panel
    socket.on('set-tiktok-user', (username) => {
        console.log(`Intentando conectar a TikTok: ${username}`);
        
        // Si ya había una conexión, la cerramos antes de abrir otra
        if (tiktokConn) tiktokConn.disconnect();

        tiktokConn = new WebcastPushConnection(username);

        tiktokConn.connect().then(state => {
            console.log(`✅ Conectado al Live de ${username}`);
            socket.emit('status', { msg: `Conectado a ${username}`, color: 'green' });
        }).catch(err => {
            console.error("❌ Error:", err);
            socket.emit('status', { msg: `Error: ${err.message}`, color: 'red' });
        });

        // Reenviar regalos reales a la vista de alertas
        tiktokConn.on('gift', (data) => {
            console.log(`🎁 REGALO DETECTADO -> Nombre: ${data.giftName} | ID: ${data.giftId} | Cantidad: ${data.repeatCount}`);//este log aparece si alguien manda regalo 
            io.emit('show-alert', { gift: data.giftName });
        });
    });

    // 2. CAPTURAR CHAT (Solo para probar si la conexión está viva)
    tiktokConn.on('chat', (data) => {
        console.log(`💬 Chat de ${data.uniqueId}: ${data.comment}`);
    });

    // 3. CAPTURAR ERRORES DE LA LIBRERÍA
    tiktokConn.on('error', (err) => {
        console.error("⚠️ Error en el stream de datos:", err);
    });

    // EVENTO 2: Prueba manual desde el botón del Panel
    socket.on('test-alert', (data) => {
        console.log(`Simulando regalo manual: ${data.gift}`);
        io.emit('show-alert', { gift: data.gift });
    });
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});