import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        next ();
        return;
    }

    const [scheme, token] = authorization!.split(' ');

    if (scheme !== 'Bearer' || !token) {
        res.status(401).json({ message: 'Invalid authorization header' });
        return;
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        res.status(401).json({ message: 'Invalid token or expired token' });
        return;
    }

    req.user = data.user;
    next();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    next();
  });
}
