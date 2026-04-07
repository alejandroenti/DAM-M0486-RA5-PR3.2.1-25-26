const WebSocket = require('ws');
const readline = require('readline');

const WS_URL = 'ws://localhost:8080';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connectat al servidor');
  console.log('Utilitza les fletxes per moure\'t. Ctrl+C per sortir.\n');
});

ws.on('message', (raw) => {
  const data = JSON.parse(raw);

  if (data.type === 'game_over') {
    console.log('\n========== PARTIDA FINALITZADA ==========');
    console.log(`Session ID:               ${data.sessionId}`);
    console.log(`Total moviments:          ${data.totalMoves}`);
    console.log(`Posició inicial:          (${data.startPosition.x}, ${data.startPosition.y})`);
    console.log(`Posició final:            (${data.endPosition.x}, ${data.endPosition.y})`);
    console.log(`Distància en línia recta: ${data.straightLineDistance}`);
    console.log('==========================================\n');
    console.log('Nova partida iniciada. Continua movent-te!\n');
  } else if (data.type === 'ack') {
    process.stdout.write(`\rPosició: (${data.position.x}, ${data.position.y})   `);
  }
});

ws.on('close', () => {
  console.log('Desconnectat del servidor');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error(`Error de connexió: ${err.message}`);
  process.exit(1);
});

// Enable raw keyboard input for arrow key capture
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    ws.close();
    process.exit();
  }

  let dx = 0;
  let dy = 0;

  switch (key.name) {
    case 'up':
      dy = 1;
      break;
    case 'down':
      dy = -1;
      break;
    case 'left':
      dx = -1;
      break;
    case 'right':
      dx = 1;
      break;
    default:
      return; // Ignore non-arrow keys
  }

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ dx, dy }));
  }
});
