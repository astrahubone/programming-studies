import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { StatusCodes } from 'http-status-codes';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' });
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      
      .select('role, email, is_active')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not found' });
    }

    if (!userData.is_active) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Account is inactive' });
    }

    req.user = {
      id: user.id,
      role: userData.role,
      email: userData.email
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication failed' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Admin access required' });
  }
  next();
};