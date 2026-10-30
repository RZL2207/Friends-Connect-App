import { Server, Socket } from 'socket.io';
import { db } from '../store';
import { v4 as uuidv4 } from 'uuid';

interface QueueUser {
  socketId: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  joinedAt: number;
}

export class Matchmaker {
  private io: Server;
  private queue: QueueUser[] = [];
  private activePairs: Map<string, { peerSocketId: string; roomId: string }> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WS] Client connected: ${socket.id}`);

      // ==========================================
      // 1. RANDOM AUDIO CALL MATCHMAKING
      // ==========================================
      socket.on('join_match_queue', (data: { userId: string }) => {
        const user = db.users.get(data.userId);
        if (!user || user.isBlocked) {
          socket.emit('match_error', { message: 'User blocked or not found' });
          return;
        }

        // Avoid duplicate queue entries
        this.removeFromQueue(socket.id);

        const newEntry: QueueUser = {
          socketId: socket.id,
          userId: user.id,
          userName: user.name,
          avatarUrl: user.avatarUrl,
          joinedAt: Date.now()
        };

        // Try to find a match immediately if someone is waiting
        if (this.queue.length > 0) {
          const peer = this.queue.shift()!;

          // Ensure not matching with oneself
          if (peer.userId === user.id) {
            this.queue.push(newEntry);
            socket.emit('queue_waiting', { queueLength: this.queue.length });
            return;
          }

          const roomId = `room_match_${uuidv4().substring(0, 8)}`;

          // Link both sockets in room
          socket.join(roomId);
          const peerSocket = this.io.sockets.sockets.get(peer.socketId);
          if (peerSocket) {
            peerSocket.join(roomId);

            this.activePairs.set(socket.id, { peerSocketId: peer.socketId, roomId });
            this.activePairs.set(peer.socketId, { peerSocketId: socket.id, roomId });

            // Notify Peer 1 (Offer initiator)
            socket.emit('match_found', {
              roomId,
              peer: { id: peer.userId, name: peer.userName, avatarUrl: peer.avatarUrl },
              isInitiator: true
            });

            // Notify Peer 2 (Receiver)
            peerSocket.emit('match_found', {
              roomId,
              peer: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
              isInitiator: false
            });

            console.log(`[MATCH] Connected ${user.name} <-> ${peer.userName} in ${roomId}`);
          } else {
            // Peer disconnected before matching, put new user in queue
            this.queue.push(newEntry);
            socket.emit('queue_waiting', { queueLength: this.queue.length });
          }
        } else {
          this.queue.push(newEntry);
          socket.emit('queue_waiting', { queueLength: this.queue.length });
          console.log(`[QUEUE] ${user.name} joined matchmaking queue. Waiting: ${this.queue.length}`);
        }
      });

      socket.on('leave_match_queue', () => {
        this.removeFromQueue(socket.id);
        socket.emit('queue_left');
      });

      socket.on('end_random_call', () => {
        this.handleCallEnd(socket);
      });

      // ==========================================
      // 2. WEBRTC SIGNALING (AUDIO / VIDEO)
      // ==========================================
      socket.on('webrtc_offer', (data: { sdp: any; roomId: string }) => {
        socket.to(data.roomId).emit('webrtc_offer', {
          sdp: data.sdp,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc_answer', (data: { sdp: any; roomId: string }) => {
        socket.to(data.roomId).emit('webrtc_answer', {
          sdp: data.sdp,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc_ice_candidate', (data: { candidate: any; roomId: string }) => {
        socket.to(data.roomId).emit('webrtc_ice_candidate', {
          candidate: data.candidate,
          fromSocketId: socket.id
        });
      });

      // ==========================================
      // 3. IN-APP SUPPORT DESK CALLING & CHAT
      // ==========================================
      socket.on('support_call_start', (data: { userId: string; agentId?: string }) => {
        const roomId = `room_support_${uuidv4().substring(0, 8)}`;
        socket.join(roomId);
        // Broadcast to support agents room
        this.io.emit('support_incoming_call', {
          roomId,
          userId: data.userId,
          callerSocketId: socket.id,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('support_call_answer', (data: { roomId: string; agentId: string }) => {
        socket.join(data.roomId);
        this.io.to(data.roomId).emit('support_call_connected', {
          roomId: data.roomId,
          agentId: data.agentId
        });
      });

      // ==========================================
      // 4. DISCONNECTION HANDLERS
      // ==========================================
      socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`);
        this.removeFromQueue(socket.id);
        this.handleCallEnd(socket);
      });
    });
  }

  private removeFromQueue(socketId: string) {
    this.queue = this.queue.filter(q => q.socketId !== socketId);
  }

  private handleCallEnd(socket: Socket) {
    const pair = this.activePairs.get(socket.id);
    if (pair) {
      this.io.to(pair.roomId).emit('call_ended', {
        reason: 'Peer disconnected or ended call',
        roomId: pair.roomId
      });

      this.activePairs.delete(socket.id);
      this.activePairs.delete(pair.peerSocketId);
    }
  }
}
