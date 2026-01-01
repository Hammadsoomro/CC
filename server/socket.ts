import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import { verifyToken } from "./auth";
import { User } from "./models";
import { connectDB } from "./db";

export function setupSocketIO(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://connectlify.netlify.app",
      ],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = verifyToken(token);
      await connectDB();
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.userId = String(user._id);
      socket.data.userRole = user.role;
      next();
    } catch (e) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.join(userId);

    socket.on("disconnect", () => {});

    socket.on("typing", (data) => {
      socket.to(userId).emit("typing", data);
    });

    socket.on("stop-typing", (data) => {
      socket.to(userId).emit("stop-typing", data);
    });
  });

  return io;
}
