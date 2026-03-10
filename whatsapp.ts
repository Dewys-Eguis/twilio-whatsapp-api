import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendProductionTest() {
    try {
        const from = process.env.TWILIO_FROM!;
        const to = process.env.TWILIO_TO!; // El número que recibirá el mensaje
        const contentSid = process.env.TWILIO_CONTENT_SID!;

        console.log(`🚀 Iniciando envío en PRODUCCIÓN desde ${from}...`);

        const contentVariables = JSON.stringify({
            "1": "Sheila Paola",
            "2": "DatSpeed Service Pro",
            "3": "2026-03-20",
            "4": "Dewys Cloud"
        });

        const message = await client.messages.create({
            from,
            to,
            contentSid,
            contentVariables
        } as any);

        console.log('✅ ¡MENSAJE ENVIADO CON ÉXITO EN PRODUCCIÓN!');
        console.log('SID:', message.sid);
        console.log('Estado:', message.status);
    } catch (error: any) {
        console.error('❌ Error en Producción:', error.message);
        if (error.code === 21608) {
            console.error('Tip: Este número aún no está autorizado o estás intentando enviar fuera de la ventana de 24h sin plantilla.');
        }
    }
}

sendProductionTest();
