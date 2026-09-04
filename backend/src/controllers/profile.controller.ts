import type { Request, Response, NextFunction } from 'express';
import {
  getPublicShowcase,
  getUserBadges,
  updateShowcasedBadges,
} from '../services/profile.service.js';

export async function getPublicShowcaseController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = typeof req.params.userId === 'string' ? req.params.userId : '';
    const showcase = await getPublicShowcase(userId);

    if (!showcase) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(showcase);
  } catch (error) {
    next(error);
  }
}

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