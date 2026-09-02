import type { Request, Response, NextFunction } from 'express';
import {
  getUserBadges,
  updateShowcasedBadges,
} from '../services/profile.service.js';

export async function getMyBadges(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const badges = await getUserBadges(req.user!.id);
    res.json({ badges });
  } catch (error) {
    next(error);
  }
}

export async function putShowcasedBadges(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const badges = await updateShowcasedBadges(
      req.user!.id,
      req.body.milestoneIds,
    );

    res.json({ badges });
  } catch (error) {
    next(error);
  }
}