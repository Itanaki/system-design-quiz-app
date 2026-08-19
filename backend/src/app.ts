import cors from 'cors';
import express from 'express';
import quizzesRouter from './routes/quizzes';
import attemptRouter from './routes/attempt';
import { errorHandler } from './middleware/error';

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const app = express();

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

app.use('/api/quizzes', quizzesRouter);
app.use('/api/attempts', attemptRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

export default app;