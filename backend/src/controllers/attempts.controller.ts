import { Request, Response, NextFunction } from 'express';
import { attemptSchema } from '../schemas/attempt.schema.js';
import { getAttemptForUser, getAttemptsForUser, submitAttempt } from '../services/quiz.service.js';
import { getMilestoneProgress } from '../services/milestone.service.js' 
import { z } from 'zod';

type AttemptParams = {
  id: string;
};

export async function postAttempt(
  req: Request, 
  res: Response, 
  next: NextFunction
  ) {
  try {
    const payload = attemptSchema.parse(req.body);

    const result = await submitAttempt({
      userId: req.user?.id,
      answers: payload.answers,
      difficulty: payload.difficulty,
      topic: payload.topic,
    });
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAttemptHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const attempts = await getAttemptsForUser(req.user!.id);
    res.json(attempts);
  } catch (err) {
    next(err);
  }
}

export async function getAttemptDetails(
  req: Request<AttemptParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'Invalid attempt ID' });
      return;
    }

    const attempt = await getAttemptForUser(req.user!.id, id);

    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    res.json(attempt);
  } catch (err) {
    next(err);
  }
}

export async function getMilestones(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const milestones = await getMilestoneProgress(req.user!.id);

    res.json({
      milestones,
    });
  } catch (error) {
    next(error);
  }
}

export const showcaseBadgesSchema = z.object({
  milestoneIds: z.array(z.string().min(1)).max(3),
});