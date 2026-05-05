import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No hay token de autenticación' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const attempts = parseInt(req.headers['x-rate-limit-attempts'] as string) || 0;
  const resetTime = parseInt(req.headers['x-rate-limit-reset'] as string) || now + 900000;
  
  if (now > resetTime) {
    req.headers['x-rate-limit-attempts'] = '0';
    req.headers['x-rate-limit-reset'] = String(now + 900000);
  } else if (attempts >= 100) {
    res.status(429).json({ error: 'Demasiadas peticiones. Intenta más tarde.' });
    return;
  } else {
    req.headers['x-rate-limit-attempts'] = String(attempts + 1);
  }
  
  next();
};