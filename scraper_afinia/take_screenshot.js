const puppeteer = require('puppeteer');
const START_RADICADO = 27550;
const URL = 'https://servicios.energiacaribemar.co/Autogeneracion/';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Close initial modal
    try {
        await page.waitForSelector('.modal-dialog button', { timeout: 3000 });
        const closeBtns = await page.$$('.modal-dialog button');
        for (const btn of closeBtns) { await btn.click().catch(() => {}); }
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch(e) {}

    await page.click('a[href="#collapse11"]').catch(()=>{});

    // Enter radicado
    const inputSelector = '#txtBsNumero';
    await page.waitForSelector(inputSelector);
    await page.type(inputSelector, START_RADICADO.toString());

    // Search
    await page.click('#BtnBuscarSol');
    
    // Wait for network
    await page.waitForResponse(r => r.url().includes('Autogeneracion') && ['xhr', 'fetch'].includes(r.request().resourceType())).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'screenshot_27550.png', fullPage: true });
    console.log("Screenshot taking done.");
    await browser.close();
})();
