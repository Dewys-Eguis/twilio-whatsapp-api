const fs = require('fs');
const html = fs.readFileSync('debug_27550.html', 'utf8');

const regex = /<td[^>]*>\s*<div[^>]*>\s*<input[^>]+id="([^"]*[Po]tencia[^"]*)"[^>]*>/gi;
const lines = html.split('\n');
lines.forEach((line, i) => {
  if (line.includes('TxtPotenciaTotAC') || line.includes('TxtPotenciaGene') || line.includes('TxtPotenciaXPanel')) {
    console.log(`--- Line ${i} ---`);
    console.log(lines.slice(Math.max(0, i - 15), i + 5).join('\n'));
  }
});
