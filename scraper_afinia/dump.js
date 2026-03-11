const fs = require('fs');
const html = fs.readFileSync('debug_27550.html', 'utf8');

// find all inputs with "otencia" in ID
const rc = /<input[^>]+id="([^"]*[Po]tencia[^"]*)"[^>]*>/gi;
let match;
while ((match = rc.exec(html)) !== null) {
  console.log("Found:", match[1]);
}

const email = /<input[^>]+id="([^"]*[Ee]mail[^"]*)"[^>]*>/gi;
while ((match = email.exec(html)) !== null) {
  console.log("Found:", match[1]);
}

const tel = /<input[^>]+id="([^"]*[Tt]elefono[^"]*)"[^>]*>/gi;
while ((match = tel.exec(html)) !== null) {
  console.log("Found:", match[1]);
}
