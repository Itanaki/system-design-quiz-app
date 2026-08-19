import { Request, Response, NextFunction } from 'express';
import * as service from '../services/quiz.service';
import { createQuestionSchema, updateQuestionSchema, questionListQuerySchema } from '../schemas/quiz.schemas';

export async function getSectionsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sections = await service.getSections();
    res.json(sections);
  } catch (err) {
    next(err);
  }
}

export async function getQuestionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const question = await service.getQuestionById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    next(err);
  }
}

export async function createQuestionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = createQuestionSchema.parse(req.body);
    const created = await service.createQuestion(payload);
    
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function getSessionQuestionsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const difficulty = 
      typeof req.query.difficulty === 'string' 
      ? req.query.difficulty 
      : undefined;
    const topic = 
      typeof req.query.topic === 'string'
      ? req.query.topic
      : undefined;

    if (!difficulty){
      return res.status(400).json({ 
        message: 'Missing difficulty parameter',
      });
    }

    const questions = await service.getSessionQuestions(difficulty, topic);

    if (questions.length === 0) {
      return res.status(404).json({ 
        message: 'No questions found for the given criteria' 
      });
    }
    res.json(questions);
  } catch (err){
    next(err);
  }
}

export async function listQuestionsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const filters = questionListQuerySchema.parse(req.query);
    const result = await service.listQuestions(filters);

    res.json(result);
  } catch (error){
    next(error);
  }
}

export async function updateQuestionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({
        message: 'Missing question ID in request parameters',
      });
    }

    const payload = updateQuestionSchema.parse(req.body);
    const updated = await service.updateQuestion(id, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    await service.deleteQuestion(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}