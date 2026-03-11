const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('debug_27550.html', 'utf8');
const $ = cheerio.load(html);
console.log("LABELS:");
$('label').each((i, el) => {
    console.log($(el).text().trim(), '->', $(el).attr('for'));
});
console.log("INPUTS WITH IDS related to potencia:");
$('input[id*="otencia"], input[id*="apacidad"]').each((i, el) => {
    console.log($(el).attr('id'));
});
