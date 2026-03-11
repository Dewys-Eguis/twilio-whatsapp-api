const puppeteer = require('puppeteer');
const fs = require('fs');

const START_RADICADO = 26664;
const URL = 'https://servicios.energiacaribemar.co/Autogeneracion/';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
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
    
    await page.waitForResponse(r => r.url().includes('Autogeneracion') && ['xhr', 'fetch'].includes(r.request().resourceType())).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Capture the HTML
    const html = await page.content();
    fs.writeFileSync('debug_26664.html', html);
    
    await page.screenshot({ path: 'screenshot_26664.png', fullPage: true });
    console.log("Screenshot and HTML taking done.");
    await browser.close();
})();
