// Script para iniciar el servidor en un puerto alternativo
console.log('Iniciando el servidor en un puerto alternativo...');

// Configurar el puerto alternativo
process.env.PORT = 5002;
console.log(`Puerto configurado: ${process.env.PORT}`);

// Importar el script principal
require('./index.js'); 