import { Request, Response, NextFunction } from 'express';
import { attemptSchema } from '../schemas/attempt.schema';
import { submitAttempt } from '../services/quiz.service';

export async function postAttempt(
  req: Request, 
  res: Response, 
  next: NextFunction
  ) {
  try {
    const payload = attemptSchema.parse(req.body);

    const result = await submitAttempt({
      userId: (req as any).user?.id,
      answers: payload.answers,
    });
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}