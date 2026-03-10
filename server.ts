import express from 'express';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post('/send-whatsapp', async (req: any, res: any) => {
    const { to, clientName, serviceName, renewalDate, distributorName, contentSid } = req.body;

    // Validación básica de parámetros obligatorios
    if (!to) {
        return res.status(400).json({ success: false, error: 'El número de destino (to) es obligatorio' });
    }

    try {
        const from = process.env.TWILIO_FROM!;
        const targetSid = contentSid || process.env.TWILIO_CONTENT_SID!;

        console.log(`Enviando mensaje a ${to} usando plantilla ${targetSid}...`);

        const contentVariables = JSON.stringify({
            "1": clientName || "Cliente",
            "2": serviceName || "Servicio",
            "3": renewalDate || "Hoy",
            "4": distributorName || "DatSpeed"
        });

        const message = await client.messages.create({
            from,
            to,
            contentSid: targetSid,
            contentVariables
        } as any);

        console.log('✅ Mensaje enviado con éxito. SID:', message.sid);
        res.status(200).json({
            success: true,
            sid: message.sid,
            status: message.status
        });
    } catch (error: any) {
        console.error('❌ Error de Twilio:', error.message);
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});

app.listen(port, () => {
    console.log('------------------------------------------------');
    console.log(`🚀 SERVIDOR EN PRODUCCIÓN CORRIENDO EN PUERTO ${port}`);
    console.log(`📡 Endpoint: http://localhost:${port}/send-whatsapp`);
    console.log(`📱 Enviando desde: ${process.env.TWILIO_FROM}`);
    console.log('------------------------------------------------');
});
