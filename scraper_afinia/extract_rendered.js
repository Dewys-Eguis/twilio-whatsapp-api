const puppeteer = require('puppeteer');

const START_RADICADO = 26664;
const URL = 'https://servicios.energiacaribemar.co/Autogeneracion/';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
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

    // Evaluate the whole rendered page text to find the tables
    const data = await page.evaluate(() => {
        const text = document.body.innerText;
        return text;
    });

    const fs = require('fs');
    fs.writeFileSync('rendered_text_26664.txt', data);
    console.log("Rendered text saved.");

    await browser.close();
})();
