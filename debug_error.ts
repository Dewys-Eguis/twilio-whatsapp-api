import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkDetailedError(sid: string) {
    try {
        const message = await client.messages(sid).fetch();
        console.log(`\n--- Análisis del Mensaje ${sid} ---`);
        console.log(`Estado: ${message.status}`);
        console.log(`Para: ${message.to}`);

        if (message.errorCode) {
            console.log(`❌ CÓDIGO DE ERROR: ${message.errorCode}`);
            console.log(`📝 DESCRIPCIÓN: ${message.errorMessage}`);
            console.log(`🔗 MÁS INFO: https://www.twilio.com/docs/errors/${message.errorCode}`);
        } else {
            console.log(`✅ El mensaje no reporta errores internos en Twilio.`);
        }
    } catch (error: any) {
        console.error('Error al consultar el SID:', error.message);
    }
}

// Probemos con el SID que salió como Undelivered en tu captura
checkDetailedError('MMf8a57b28a264f2c7c161bacdf168c4ad');
