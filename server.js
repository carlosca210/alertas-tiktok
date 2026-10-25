const express = require('express');
const http = require('http');
const path = require('path');
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

// 📁 SERVIR CARPETA ESTÁTICA CON RUTA ABSOLUTA (CORREGIDO PARA RENDER / LINUX)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Ruta pública principal (Alertas para OBS)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// 📁 LIBRERÍA DINÁMICA EN MEMORIA
let dynamicLibrary = {
    "alert_1": { giftName: "White Rose", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792904898/rosa.webm", volumen: 0.15, duracion: 5, screen: "screen4", activo: false },
    "alert_2": { giftName: "Doughnut", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792904844/dona.webm", volumen: 0.15, duracion: 4, screen: "screen4", activo: false },
    "alert_3": { giftName: "GG", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901664/gg.webm", volumen: 0.15, duracion: 6, screen: "screen4", activo: false },
    "alert_4": { giftName: "Rosa", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792904978/rosa-grande.webm", volumen: 0.15, duracion: 8, screen: "screen4", activo: false },
    "alert_5": { giftName: "Finger Heart", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792905095/corazon-coreano.webm", volumen: 0.15, duracion: 5, screen: "screen4", activo: false },
    //alertas mujeres
    "alert_6": { giftName: "White Rose", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792903424/rosa-blanca-m.webm", volumen: 0.1, duracion: 11, screen: "screen1", activo:true },
    "alert_7": { giftName: "GG", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901666/gg-m.webm", volumen: 0.25, duracion: 9, screen: "screen1", activo:true },
    "alert_8": { giftName: "Finger Heart", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901637/corazon-coreano-m.webm", volumen: 0.1, duracion: 11, screen: "screen1", activo:true },
    "alert_9": { giftName: "Rosa", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901636/rosa-grande-m.webm", volumen: 0.1, duracion: 9, screen: "screen1", activo:true },
    "alert_10": { giftName: "Doughnut", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901665/dona-m.webm", volumen: 0.1, duracion: 9, screen: "screen1", activo:true },
    //alertas hombres
    "alert_11": { giftName: "Ice Cream Cone", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901665/helado.webm", volumen: 0.5, duracion: 9, screen: "screen2", activo:true },
    "alert_12": { giftName: "It's corn", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901637/choclo.webm", volumen: 0.1, duracion: 11, screen: "screen2", activo:true },
    "alert_13": { giftName: "BFF Necklace", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901642/collar-osos.webm", volumen: 0.2, duracion: 11, screen: "screen2", activo:true },
    "alert_14": { giftName: "Capybara", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901647/capibara.webm", volumen: 0.1, duracion: 14, screen: "screen2", activo:true },
    "alert_15": { giftName: "Coconut", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792904577/palmera.webm", volumen: 0.15, duracion: 14, screen: "screen2", activo:true },
    //alertas mujeres mas
    "alert_16": { giftName: "Cap", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792902028/gorra.webm", volumen: 0.25, duracion: 14, screen: "screen3", activo:true },
    "alert_17": { giftName: "Paper Crane", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901648/cisne-azul.webm", volumen: 0.15, duracion: 10, screen: "screen3", activo:true },
    "alert_18": { giftName: "Hand Heart", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901655/corazon-en-manos.webm", volumen: 0.25, duracion: 10, screen: "screen3", activo:true },
    "alert_19": { giftName: "Sunglasses", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901652/gafas.webm", volumen: 0.20, duracion: 11, screen: "screen3", activo:true },
    "alert_20": { giftName: "Corgi", archivo: "https://res.cloudinary.com/uflbmdxy/video/upload/v1792901648/corgi.webm", volumen: 0.25, duracion: 16, screen: "screen3", activo:true }
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

        tiktokConn = new WebcastPushConnection(username, {
            signApiKey: process.env.EULERSTREAM_API_KEY
        });
        
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

                    // 🛑 VALIDACIÓN: Si la alerta está desactivada (activo: false), la ignoramos
                    if (config.activo === false) {
                        console.log(`⚠️ Alerta "${alertId}" (${config.giftName}) omitida porque está desactivada.`);
                        return;
                    }
                    
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

                // 🛑 VALIDACIÓN TAMBIÉN EN PRUEBAS MANUALES
                if (config.activo === false) {
                    console.log(`⚠️ Alerta de prueba "${alertId}" omitida porque está desactivada.`);
                    return;
                }

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