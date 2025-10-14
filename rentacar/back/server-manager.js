const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const readline = require('readline');

// Configuración
const DEFAULT_PORT = 5001;
const MAX_PORT_CHECK = 5010; // Probar hasta este puerto
let currentPort = DEFAULT_PORT;

// Función para verificar si un puerto está en uso
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        // El puerto está en uso
        resolve(true);
      })
      .once('listening', () => {
        // El puerto está libre
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Función para encontrar un puerto disponible
async function findAvailablePort() {
  let port = DEFAULT_PORT;
  
  while (port <= MAX_PORT_CHECK) {
    console.log(`Verificando disponibilidad del puerto ${port}...`);
    const inUse = await isPortInUse(port);
    
    if (!inUse) {
      console.log(`Puerto ${port} disponible.`);
      return port;
    }
    
    console.log(`Puerto ${port} en uso, probando el siguiente...`);
    port++;
  }
  
  throw new Error(`No se encontró ningún puerto disponible entre ${DEFAULT_PORT} y ${MAX_PORT_CHECK}.`);
}

// Función para iniciar el servidor
async function startServer() {
  try {
    // Encontrar un puerto disponible
    const port = await findAvailablePort();
    currentPort = port;
    
    console.log(`\nIniciando el servidor en el puerto ${port}...`);
    
    // Configurar el entorno para el proceso hijo
    const env = { ...process.env, PORT: port.toString() };
    
    // Iniciar el servidor como un proceso hijo
    const server = spawn('node', [path.join(__dirname, 'index.js')], { 
      env, 
      stdio: 'pipe' 
    });
    
    // Manejar la salida del servidor
    server.stdout.on('data', (data) => {
      console.log(`Servidor (${port}): ${data.toString().trim()}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Error (${port}): ${data.toString().trim()}`);
    });
    
    // Manejar el cierre del servidor
    server.on('close', (code) => {
      console.log(`\nEl servidor en el puerto ${port} se ha detenido con código: ${code}`);
      
      if (code !== 0) {
        console.log('Reiniciando el servidor en 5 segundos...');
        setTimeout(startServer, 5000);
      }
    });
    
    // Configurar un readline interface para comandos
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n==========================================');
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
    console.log('Comandos disponibles:');
    console.log('  restart - Reiniciar el servidor');
    console.log('  stop    - Detener el servidor');
    console.log('  exit    - Salir completamente');
    console.log('==========================================\n');
    
    // Manejar comandos
    rl.on('line', (input) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'restart':
          console.log('Reiniciando el servidor...');
          server.kill();
          break;
          
        case 'stop':
          console.log('Deteniendo el servidor...');
          server.kill();
          rl.close();
          break;
          
        case 'exit':
          console.log('Saliendo...');
          server.kill();
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`Comando no reconocido: ${input}`);
          console.log('Comandos disponibles: restart, stop, exit');
      }
    });
    
    // Manejar el cierre del readline interface
    rl.on('close', () => {
      console.log('Sesión terminada.');
      process.exit(0);
    });
    
    // Manejar señales de interrupción
    process.on('SIGINT', () => {
      console.log('\nRecibido SIGINT. Deteniendo el servidor...');
      server.kill();
      rl.close();
    });
    
    return server;
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer(); 