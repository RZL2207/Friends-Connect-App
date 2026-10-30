import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import celebritiesRoutes from './routes/celebrities.routes';
import supportRoutes from './routes/support.routes';
import adminRoutes from './routes/admin.routes';
import { Matchmaker } from './realtime/matchmaker';

import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for web, mobile simulators, and native devices
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve Web Portal
const webPath = path.resolve(__dirname, '../../web');
app.use(express.static(webPath));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    platform: 'FriendConnect Unified Platform',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/celebrities', celebritiesRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

// HTTP & Socket Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Realtime Matchmaking & WebRTC Signaling
new Matchmaker(io);

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 FriendConnect Backend API & Real-time Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket / Matchmaking Gateway: Ready on ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});
