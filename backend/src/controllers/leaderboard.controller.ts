import { Request, Response, NextFunction } from 'express';
import * as service from '../services/leaderboard.service.js';
import {
  leaderboardQuerySchema,
  difficultyLevelSchema,
  myRankQuerySchema,
} from '../schemas/leaderboard.schema.js';

export async function getGlobalLeaderboardController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, pageSize } = leaderboardQuerySchema.parse(req.query);
    const result = await service.getLeaderboard('global', page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDifficultyLeaderboardController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const level = difficultyLevelSchema.parse(req.params.level);
    const { page, pageSize } = leaderboardQuerySchema.parse(req.query);
    const result = await service.getLeaderboard(level, page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyRankController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { scope } = myRankQuerySchema.parse(req.query);
    const result = await service.getMyRank(req.user!.id, scope);
    res.json(result);
  } catch (err) {
    next(err);
  }
}