import cors from 'cors';
import express from 'express';
import quizzesRouter from './routes/quizzes.js';
import attemptRouter from './routes/attempt.js';
import { errorHandler } from './middleware/error.js';

const frontendOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
const app = express();

app.use(cors({ origin: frontendOrigins }));
app.use(express.json());

app.use('/api/quizzes', quizzesRouter);
app.use('/api/attempts', attemptRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

export default app;