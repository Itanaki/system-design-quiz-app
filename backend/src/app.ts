import express from 'express';
import quizzesRouter from './routes/quizzes';
import attemptRouter from './routes/attempt';

const app = express();

app.use(express.json());

app.use('/api/quizzes', quizzesRouter);
app.use('/api/attempts', attemptRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

export default app;