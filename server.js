const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);

// 🔑 DEFINIR TU CONTRASEÑA
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RichixAdmin2026";

// 🆔 GENERAR UN ID ÚNICO CADA VEZ QUE SE LEVANTA O REINICIA EL SERVIDOR
const SERVER_INSTANCE_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

function generarToken(password) {
    return Buffer.from(`${password}:${SERVER_INSTANCE_ID}`).toString('base64');
}

function validarToken(token) {
    if (!token) return false;
    const tokenValido = generarToken(ADMIN_PASSWORD);
    return token === tokenValido;
}

app.use(express.json());

// Servir archivos estáticos pero excluyendo control.html del acceso directo
app.use(express.static('public', { index: false }));

// Ruta pública principal (Alertas para OBS)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Endpoint de Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, token: generarToken(ADMIN_PASSWORD) });
    }
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
});

// Endpoint para verificar si la sesión sigue vigente (misma ejecución de servidor)
app.post('/api/verify-token', (req, res) => {
    const { token } = req.body;
    if (validarToken(token)) {
        return res.json({ valid: true });
    }
    return res.status(401).json({ valid: false });
});

// Ruta para el Panel de Control (Protegida)
app.get('/control.html', (req, res) => {
    res.sendFile(__dirname + '/public/control.html');
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// 📁 LIBRERÍA DINÁMICA EN MEMORIA
let dynamicLibrary = {
    "alert_1": { giftName: "White Rose", archivo: "videos/rosa.webm", volumen: 0.1, duracion: 5, screen: "screen4" },
    "alert_2": { giftName: "Doughnut", archivo: "videos/dona.webm", volumen: 0.1, duracion: 4, screen: "screen4" },
    "alert_3": { giftName: "GG", archivo: "videos/gg.webm", volumen: 0.1, duracion: 6, screen: "screen4" },
    "alert_4": { giftName: "Rosa", archivo: "videos/rosa-grande.webm", volumen: 0.1, duracion: 8, screen: "screen4" },
    "alert_5": { giftName: "Finger Heart", archivo: "videos/corazon-coreano.webm", volumen: 0.1, duracion: 5, screen: "screen4" },
    //alertas mujeres
    "alert_6": { giftName: "White Rose", archivo: "videos/rosa-blanca-m.mp4", volumen: 0.1, duracion: 5, screen: "screen1" },
    "alert_7": { giftName: "GG", archivo: "videos/gg-m.webm", volumen: 0.1, duracion: 5, screen: "screen1" },
    "alert_8": { giftName: "Finger Heart", archivo: "videos/corazon-coreano-m.webm", volumen: 0.1, duracion: 5, screen: "screen1" },
    "alert_9": { giftName: "Rosa", archivo: "videos/rosa-grande-m.webm", volumen: 0.1, duracion: 5, screen: "screen1" },
    "alert_10": { giftName: "Doughnut", archivo: "videos/dona-m.webm", volumen: 0.1, duracion: 5, screen: "screen1" },
    //alertas hombres
    "alert_11": { giftName: "helado", archivo: "videos/helado.webm", volumen: 0.1, duracion: 5, screen: "screen2" },
    "alert_12": { giftName: "", archivo: "videos/choclo.webm", volumen: 0.1, duracion: 5, screen: "screen2" },
    "alert_13": { giftName: "", archivo: "videos/collar-osos.webm", volumen: 0.1, duracion: 5, screen: "screen2" },
    "alert_14": { giftName: "capybara", archivo: "videos/capibara.webm", volumen: 0.1, duracion: 5, screen: "screen2" },
    "alert_15": { giftName: "", archivo: "videos/palmera.webm", volumen: 0.1, duracion: 5, screen: "screen2" },
    //alertas mujeres mas
    "alert_16": { giftName: "", archivo: "videos/gorra.webm", volumen: 0.1, duracion: 5, screen: "screen3" },
    "alert_17": { giftName: "Paper Crane", archivo: "videos/cisne-azul.webm", volumen: 0.1, duracion: 5, screen: "screen3" },
    "alert_18": { giftName: "Hand Heart", archivo: "videos/corazon-en-manos.webm", volumen: 0.1, duracion: 5, screen: "screen3" },
    "alert_19": { giftName: "", archivo: "videos/gafas.webm", volumen: 0.1, duracion: 5, screen: "screen3" },
    "alert_20": { giftName: "", archivo: "videos/corgi.webm", volumen: 0.1, duracion: 5, screen: "screen3" }
};

let tiktokConn;

// Control de eventos de regalos procesados para prevenir duplicados de red
const tiktokMsgIds = new Set();
const MAX_TIKTOK_MSG_IDS = 200;

io.on('connection', (socket) => {
    console.log('✅ Cliente conectado al socket:', socket.id);

    // 1. Enviar la configuración actual al cliente recién conectado
    socket.emit('update-library', dynamicLibrary);

    // 2. Guardar cambios emitidos desde control.html
    socket.on('save-library', (data) => {
        const token = typeof data === 'object' ? data.token : null;
        if (!validarToken(token)) return;

        if (data.library) {
            dynamicLibrary = data.library;
            console.log("🔄 Configuración de alertas actualizada desde el panel.");
            // Transmitir la librería actualizada a todas las pantallas abiertas
            io.emit('update-library', dynamicLibrary);
        }
    });

    socket.on('set-tiktok-user', (data) => {
        const username = typeof data === 'object' ? data.username : data;
        const token = typeof data === 'object' ? data.token : null;

        if (!validarToken(token)) {
            return socket.emit('status', { msg: '⛔ Acceso denegado: Token inválido', color: 'red' });
        }

        console.log(`🔍 Intentando conectar a TikTok: ${username}`);
        
        if (tiktokConn) {
            tiktokConn.removeAllListeners();
            try { tiktokConn.disconnect(); } catch (e) {}
            tiktokConn = null;
        }

        tiktokConn = new WebcastPushConnection(username);

        tiktokConn.on('gift', (data) => {
            // 1. Manejo de Rachas (Combos de regalos)
            // Si el regalo es de racha (giftType === 1) y aún no termina (repeatEnd es false),
            // ignoramos el conteo intermedio para procesar solo el total final.
            if (data.giftType === 1 && !data.repeatEnd) {
                return;
            }

            // 2. Determinar la cantidad enviada
            const cantidad = data.repeatCount || 1;

            // 3. Generar ID único para evitar duplicados por mala red de TikTok
            const uniqueEventId = data.msgId || `${data.userId}_${data.giftId}_${data.timestamp || Date.now()}`;

            if (tiktokMsgIds.has(uniqueEventId)) {
                console.warn(`⚠️ Evento de regalo duplicado ignorado [ID: ${uniqueEventId}]`);
                return;
            }

            // Guardar en el conjunto de IDs procesados
            tiktokMsgIds.add(uniqueEventId);
            if (tiktokMsgIds.size > MAX_TIKTOK_MSG_IDS) {
                const primerId = tiktokMsgIds.values().next().value;
                tiktokMsgIds.delete(primerId);
            }

            console.log(`🎁 REGALO RECIBIDO: "${data.giftName}" x${cantidad} por ${data.uniqueId}`);

            // 4. Disparar alertas asociadas a todas las tarjetas que tengan este regalo
            Object.keys(dynamicLibrary).forEach(alertId => {
                const config = dynamicLibrary[alertId];
                if (config.giftName === data.giftName) {
                    
                    // Emitir la alerta 'cantidad' veces a la cola de OBS
                    for (let i = 0; i < cantidad; i++) {
                        io.emit('show-alert', { 
                            gift: data.giftName,
                            alertId: alertId,
                            msgId: `${uniqueEventId}_${alertId}_${i}`,
                            config: config
                        });
                    }

                }
            });
        });

        tiktokConn.on('chat', (data) => {
            console.log(`💬 Chat de ${data.uniqueId}: ${data.comment}`);
        });

        tiktokConn.on('error', (err) => {
            console.error("⚠️ Error en TikTok Conn:", err);
        });

        tiktokConn.connect().then(state => {
            console.log(`✅ Conectado al Live de ${username}`);
            socket.emit('status', { msg: `Conectado a ${username}`, color: 'green' });
        }).catch(err => {
            console.error("❌ Error de conexión:", err);
            socket.emit('status', { msg: `Error: ${err.message}`, color: 'red' });
        });
    });

    socket.on('test-alert', (data) => {
        let giftName = "";
        let token = null;

        if (typeof data === 'object' && data !== null) {
            giftName = data.gift;
            token = data.token;
        } else if (typeof data === 'string') {
            giftName = data;
        }

        if (!validarToken(token)) {
            console.warn("⛔ Intento no autorizado");
            return;
        }

        if (typeof giftName === 'object' && giftName !== null) {
            giftName = giftName.gift || "";
        }

        console.log(`📡 Simulando regalo manual: "${giftName}"`);

        Object.keys(dynamicLibrary).forEach(alertId => {
            const config = dynamicLibrary[alertId];
            if (config.giftName === giftName) {
                io.emit('show-alert', { 
                    gift: giftName,
                    alertId: alertId,
                    msgId: `${Date.now()}_${alertId}`,
                    config: config
                });
            }
        });
    });

    socket.on('stop-alerts', (data) => {
        const token = typeof data === 'object' ? data.token : null;

        if (!validarToken(token)) {
            return;
        }

        console.log("🛑 Orden recibida: Deteniendo y limpiando cola de alertas.");
        io.emit('force-stop-alerts');
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});