import { Request, Response, NextFunction } from 'express';
import * as service from '../services/quiz.service';

export async function getSections(req: Request, res: Response, next: NextFunction) {
  try {
    const sections = await service.getSections();
    res.json(sections);
  } catch (err) {
    next(err);
  }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const q = await service.getQuestionById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json(q);
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const created = await service.createQuestion(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}