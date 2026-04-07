const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// Load .env variables
const dotenv = require('dotenv');
dotenv.config();

const { logger } = require('./config/logger');

const INACTIVITY_TIMEOUT_MS = 10000;

async function startServer() {
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const sessionsCol = db.collection(process.env.COLLECTION_SESSIONS_NAME);
  const positionsCol = db.collection(process.env.COLLECTION_PLAYER_POSITIONS_NAME);
  logger.info('Connected to MongoDB');

  // Create WebSocket server
  const wss = new WebSocket.Server({ port: process.env.WS_PORT });
  logger.info(`WebSocket server listening on ws://${process.env.WS_HOST}:${process.env.WS_PORT}`);

  wss.on('connection', (ws) => {
    let sessionId = crypto.randomUUID();
    let moveCount = 0;
    let currentPosition = { x: 0, y: 0 };
    let firstPosition = null;
    let lastPosition = null;
    let inactivityTimer = null;

    // Create initial session document (matches Session model)
    const now = new Date();
    sessionsCol.insertOne({
      sessionId,
      totalDistance: 0,
      createdAt: now,
      updatedAt: now
    });

    logger.info(`Player connected. Session started: ${sessionId}`);

    const endGame = async () => {
      if (firstPosition && lastPosition) {
        const dx = lastPosition.x - firstPosition.x;
        const dy = lastPosition.y - firstPosition.y;
        const distance = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;

        // Update session with totalDistance
        await sessionsCol.updateOne(
          { sessionId },
          { $set: { totalDistance: distance, updatedAt: new Date() } }
        );

        const summary = {
          type: 'game_over',
          sessionId,
          totalMoves: moveCount,
          startPosition: firstPosition,
          endPosition: lastPosition,
          straightLineDistance: distance
        };

        logger.info(`Session ${sessionId} ended. Distance: ${distance}`);
        ws.send(JSON.stringify(summary));
      }

      // Reset for a new session
      sessionId = crypto.randomUUID();
      moveCount = 0;
      currentPosition = { x: 0, y: 0 };
      firstPosition = null;
      lastPosition = null;

      const newNow = new Date();
      await sessionsCol.insertOne({
        sessionId,
        totalDistance: 0,
        createdAt: newNow,
        updatedAt: newNow
      });

      logger.info(`New session ready: ${sessionId}`);
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logger.info(`Player inactive for 10s in session ${sessionId}`);
        endGame();
      }, INACTIVITY_TIMEOUT_MS);
    };

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw);
        const { dx, dy } = data;

        // Validate: dx and dy must be -1, 0 or +1
        const valid = [-1, 0, 1];
        if (!valid.includes(dx) || !valid.includes(dy)) {
          logger.warn(`Invalid delta received: dx=${dx}, dy=${dy}`);
          return;
        }

        // Update server-side cumulative position
        currentPosition.x += dx;
        currentPosition.y += dy;

        moveCount++;

        if (!firstPosition) firstPosition = { ...currentPosition };
        lastPosition = { ...currentPosition };

        logger.info(`Move #${moveCount} delta:(${dx},${dy}) -> pos:(${currentPosition.x},${currentPosition.y}) session:${sessionId}`);

        // Save movement delta as PlayerPosition document
        const moveNow = new Date();
        await positionsCol.insertOne({
          playerPositionId: crypto.randomUUID(),
          sessionId,
          dxPosition: dx,
          dyPosition: dy,
          createdAt: moveNow,
          updatedAt: moveNow
        });

        // Update session timestamp
        await sessionsCol.updateOne(
          { sessionId },
          { $set: { updatedAt: moveNow } }
        );

        logger.info(`Movement #${moveCount} saved for session ${sessionId}`);

        // Reset the 10s inactivity timer
        resetInactivityTimer();

        // Acknowledge the client with server-tracked position
        ws.send(JSON.stringify({ type: 'ack', moveNumber: moveCount, position: currentPosition }));
      } catch (err) {
        logger.error(`Error processing message: ${err.message}`);
      }
    });

    ws.on('close', () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      logger.info(`Player disconnected from session ${sessionId}`);
    });
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Shutting down the server...');
    process.exit(0);
});

startServer().catch((err) => logger.error(`Server failed to start: ${err.message}`));