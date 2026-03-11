const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const fs = require('fs');

const START_RADICADO = parseInt(process.argv[2]) || 27500;
const END_RADICADO = parseInt(process.argv[3]) || 28000;
const URL = 'https://servicios.energiacaribemar.co/Autogeneracion/';

async function runScraper() {
    console.log(`Iniciando Scraper para el rango ${START_RADICADO} al ${END_RADICADO}...`);
    console.log(`URL objetivo: ${URL}`);

    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    const results = [];

    console.log('Verificando modales iniciales...');
    try {
        await page.waitForSelector('.modal-dialog button', { timeout: 3000 });
        const closeBtns = await page.$$('.modal-dialog button');
        for (const btn of closeBtns) {
            await btn.click().catch(() => {});
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch(e) {}

    try {
        await page.click('a[href="#collapse11"]'); 
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch(e) {}

    for (let radicado = START_RADICADO; radicado <= END_RADICADO; radicado++) {
        console.log(`\nConsultando radicado: ${radicado}`);
        
        try {
            const inputSelector = '#txtBsNumero';
            await page.waitForSelector(inputSelector, { timeout: 5000 });
            
            await page.click(inputSelector, { clickCount: 3 });
            await page.keyboard.press('Backspace');
            
            await page.type(inputSelector, radicado.toString());
            
            const btnSelector = '#BtnBuscarSol';
            
            // Watch for new target BEFORE clicking
            const targetPromise = new Promise(resolve => {
                browser.once('targetcreated', async target => {
                    if (target.type() === 'page') {
                        resolve(await target.page());
                    }
                });
            });

            await page.click(btnSelector);
            
            // Wait for either the new page to appear, or the error modal on the current page
            const result = await Promise.race([
                targetPromise.then(p => ({ type: 'newpage', page: p })),
                page.waitForFunction(() => {
                    const errorVisible = Array.from(document.querySelectorAll('.bootbox, .modal')).some(
                        m => m.style.display === 'block' && (m.innerText.includes("No se encontro") || m.innerText.includes("Información") || m.innerText.includes("resultados"))
                    );
                    return errorVisible;
                }, { timeout: 15000 }).then(() => ({ type: 'error' })).catch(() => ({ type: 'timeout' }))
            ]);
            
            if (result.type === 'error') {
                console.log(`[!] Radicado ${radicado}: No encontrado (Modal de error detectado).`);
                
                await page.evaluate(() => {
                    const modals = Array.from(document.querySelectorAll('.bootbox, .modal'));
                    for (const modal of modals) {
                        if (modal.style.display === 'block') {
                            const btn = modal.querySelector('.bootbox-accept, .btn-primary, [data-dismiss="modal"]');
                            if (btn) btn.click();
                        }
                    }
                });
                continue; 
            } else if (result.type === 'timeout') {
                console.log(`[!] Radicado ${radicado}: Timeout esperando respuesta.`);
                continue;
            }

            const newPage = result.page;
            console.log(`[+] Radicado ${radicado}: Nueva pestaña abierta, extrayendo datos...`);
            
            // Esperar que la nueva página cargue
            await newPage.waitForFunction(() => document.readyState === 'complete', { timeout: 15000 }).catch(()=>null);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const extracted = await newPage.evaluate(() => {
                // In the popup, the values are often rendered inside <label> elements with these IDs
                
                const getLabelText = (id) => {
                    const el = document.querySelector(id);
                    return el ? el.innerText.trim() : null;
                };

                let potenciaAC = getLabelText('#TxtPotenciaTotAC') || getLabelText('#strPotenciaNominal');
                let potenciaDC = getLabelText('#TxtCapacidadDC') || getLabelText('#strKVASol');
                let email = getLabelText('#TxtEmailCli') || getLabelText('#txtBsEmailSol');
                let telefono = getLabelText('#TxtTelefonoCli') || getLabelText('#txtTelefono');
                let fechaSol = getLabelText('#TxtFechaSol');

                // Fallbacks just in case they are rendered differently
                const tableTds = Array.from(document.querySelectorAll('td'));
                const thsTds = Array.from(document.querySelectorAll('th, td'));

                if (!email) {
                   const emailTd = tableTds.find(td => td.innerText && td.innerText.includes('@'));
                   if (emailTd && emailTd.innerText.trim().length > 5) email = emailTd.innerText.trim();
                }

                if (!telefono) {
                   const telHeader = thsTds.find(th => th.innerText && (th.innerText.toLowerCase().includes('teléfono/celular') || th.innerText.toLowerCase().includes('telefono')));
                   if (telHeader && telHeader.nextElementSibling) {
                       telefono = telHeader.nextElementSibling.innerText.trim();
                   }
                }

                // Buscando las potencias
                if (!potenciaAC || !potenciaDC) {
                   const acNode = tableTds.find(td => td.innerText && (td.innerText.toLowerCase().includes('potencia ac') || td.innerText.toLowerCase().includes('potencia nominal')));
                   if (acNode && acNode.nextElementSibling) potenciaAC = acNode.nextElementSibling.innerText.trim();
                   
                   const dcNode = tableTds.find(td => td.innerText && (td.innerText.toLowerCase().includes('potencia dc') || td.innerText.toLowerCase().includes('kva solicitados')));
                   if (dcNode && dcNode.nextElementSibling) potenciaDC = dcNode.nextElementSibling.innerText.trim();
                }

                return {
                    potenciaAC: potenciaAC || null,
                    potenciaDC: potenciaDC || null,
                    email: email || null,
                    telefono: telefono || null,
                    fechaSol: fechaSol || 'N/A',
                    rawHtml: '' // No longer returning massive innerHTML
                };
            });

            // Validar si encontramos algo para guardarlo
            if (extracted.potenciaAC || extracted.email || extracted.telefono || extracted.potenciaDC) {
                console.log(`[+] Radicado ${radicado}: ¡Datos extraídos! Email: ${extracted.email || 'N/A'}`);
                results.push({
                    numero_radicado: radicado,
                    fecha_solicitud: extracted.fechaSol, 
                    email: extracted.email || 'N/A',
                    telefono_cliente: extracted.telefono || 'N/A',
                    potencia_dc: extracted.potenciaDC || 'N/A',
                    potencia_ac: extracted.potenciaAC || 'N/A'
                });
            } else {
                 console.log(`[!] Radicado ${radicado}: La nueva pestaña no contiene los datos esperados.`);
                 results.push({
                    numero_radicado: radicado,
                    fecha_solicitud: 'N/A', 
                    email: 'No encontrado en nueva pestaña',
                    telefono_cliente: 'N/A',
                    potencia_dc: 'N/A',
                    potencia_ac: 'N/A'
                });
            }

            await newPage.close();
            
        } catch (error) {
            console.error(`[-] Error procesando el radicado ${radicado}:`, error.message);
        }
    }

    if (results.length > 0) {
        console.log(`\nGenerando archivo Excel con ${results.length} registros...`);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Datos Extraidos');
        
        sheet.columns = [
            { header: 'numero_radicado', key: 'numero_radicado', width: 18 },
            { header: 'fecha_solicitud', key: 'fecha_solicitud', width: 20 },
            { header: 'email', key: 'email', width: 35 },
            { header: 'telefono_cliente', key: 'telefono_cliente', width: 20 },
            { header: 'potencia_dc', key: 'potencia_dc', width: 15 },
            { header: 'potencia_ac', key: 'potencia_ac', width: 15 }
        ];

        sheet.getRow(1).font = { bold: true };
        sheet.addRows(results);
        
        const fileName = 'Radicados_Autogeneracion.xlsx';
        await workbook.xlsx.writeFile(fileName);
        console.log(`✅ ¡Proceso finalizado! Archivo guardado como: ${fileName}`);
    } else {
        console.log('\n⚠️ El proceso terminó, pero no se encontró ningún dato para guardar en el Excel.');
    }

    await browser.close();
}

runScraper();
