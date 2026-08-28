import cors from 'cors';
import express from 'express';
import quizzesRouter from './routes/quizzes.js';
import attemptRouter from './routes/attempt.js';
import leaderboardRouter from './routes/leaderboard.js';
import { errorHandler } from './middleware/error.js';

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.use('/api/quizzes', quizzesRouter);
app.use('/api/attempts', attemptRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

export default app;