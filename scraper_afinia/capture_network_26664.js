const puppeteer = require('puppeteer');
const fs = require('fs');

const START_RADICADO = 26664;
const URL = 'https://servicios.energiacaribemar.co/Autogeneracion/';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Capture all responses
    const responses = [];
    page.on('response', async (response) => {
        try {
            if (response.url().includes('Autogeneracion')) {
                const text = await response.text();
                if (text.includes('info@greetenergy.com') || text.includes('JAVIER EMILIO')) {
                    console.log('--- FOUND DATA IN RESPONSE ---');
                    console.log('URL:', response.url());
                    console.log('BODY:', text.substring(0, 500));
                }
            }
        } catch (e) {}
    });

    await page.goto(URL, { waitUntil: 'networkidle2' });

    try {
        await page.waitForSelector('.modal-dialog button', { timeout: 3000 });
        const closeBtns = await page.$$('.modal-dialog button');
        for (const btn of closeBtns) { await btn.click().catch(() => {}); }
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch(e) {}

    await page.click('a[href="#collapse11"]').catch(()=>{});

    const inputSelector = '#txtBsNumero';
    await page.waitForSelector(inputSelector);
    await page.type(inputSelector, START_RADICADO.toString());

    await page.click('#BtnBuscarSol');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("Network capture done.");
    await browser.close();
})();
