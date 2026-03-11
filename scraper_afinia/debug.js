const puppeteer = require('puppeteer');
const fs = require('fs');

async function debug() {
    console.log("Iniciando debug...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('https://servicios.energiacaribemar.co/Autogeneracion/', { waitUntil: 'networkidle2' });

    // Close modal
    try {
        await page.waitForSelector('.modal-dialog button', { timeout: 3000 });
        const closeBtns = await page.$$('.modal-dialog button');
        for (const btn of closeBtns) {
            await btn.click().catch(() => {});
        }
    } catch(e) {}
    
    // Expand
    try {
        await page.click('a[href="#collapse11"]'); 
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {}

    // Search 27550
    console.log("Buscando 27550...");
    await page.type('#txtBsNumero', '27550');
    await page.click('#BtnBuscarSol');
    
    await new Promise(r => setTimeout(r, 4000)); // wait for ajax

    await page.screenshot({ path: 'debug_27550.png', fullPage: true });
    
    const html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('debug_27550.html', html);
    
    console.log("Terminado. Guardados debug_27550.png y debug_27550.html");
    await browser.close();
}

debug();
