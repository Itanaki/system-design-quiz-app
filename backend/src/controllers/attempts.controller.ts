import { Request, Response, NextFunction } from 'express';
import { submitAttempt } from '../services/quiz.service';

export async function postAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = {
      userId: (req as any).user?.id, // if auth exists
      answers: req.body.answers || [],
    };
    const result = await submitAttempt(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}