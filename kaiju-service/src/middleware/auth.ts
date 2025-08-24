import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  walletAddress?: string;
}

export const authenticateToken = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('No token provided', 401);
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      throw new AppError('Invalid token', 403);
    }

    const payload = decoded as { userId: string; walletAddress: string };
    req.userId = payload.userId;
    req.walletAddress = payload.walletAddress;
    next();
  });
};

export const generateToken = (userId: string, walletAddress: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, walletAddress },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};