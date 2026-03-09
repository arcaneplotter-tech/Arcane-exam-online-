import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = 3000;

app.use(express.static(process.cwd()));

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  socket.on('createRoom', ({ userName }) => {
    const roomId = generateRoomId();
    const user = { id: socket.id, name: userName, score: 0, finished: false, answers: {} };
    rooms.set(roomId, {
      id: roomId,
      hostId: socket.id,
      status: 'lobby',
      users: [user],
      examData: null
    });
    socket.join(roomId);
    socket.emit('roomCreated', rooms.get(roomId));
  });

  socket.on('joinRoom', ({ roomId, userName }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.status !== 'lobby') {
      socket.emit('error', 'Exam already started');
      return;
    }
    const user = { id: socket.id, name: userName, score: 0, finished: false, answers: {} };
    room.users.push(user);
    socket.join(roomId);
    io.to(roomId).emit('roomUpdated', room);
  });

  socket.on('updateExam', ({ roomId, examData }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.examData = examData;
      io.to(roomId).emit('roomUpdated', room);
    }
  });

  socket.on('startExam', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.status = 'exam';
      io.to(roomId).emit('examStarted', room);
    }
  });

  socket.on('submitExam', ({ roomId, score, answers }) => {
    const room = rooms.get(roomId);
    if (room) {
      const user = room.users.find((u: any) => u.id === socket.id);
      if (user) {
        user.score = score;
        user.finished = true;
        user.answers = answers;
        
        const allFinished = room.users.every((u: any) => u.finished);
        if (allFinished) {
          room.status = 'leaderboard';
        }
        io.to(roomId).emit('roomUpdated', room);
      }
    }
  });

  socket.on('playAgain', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.status = 'lobby';
      room.users.forEach((u: any) => {
        u.score = 0;
        u.finished = false;
        u.answers = {};
      });
      io.to(roomId).emit('resetToLobby', room);
    }
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const userIndex = room.users.findIndex((u: any) => u.id === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        if (room.users.length === 0) {
          rooms.delete(roomId);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.users[0].id;
          }
          io.to(roomId).emit('roomUpdated', room);
        }
      }
    });
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
