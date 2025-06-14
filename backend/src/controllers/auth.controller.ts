import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from '../middleware/auth.js';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Email and password are required'
        });
      }

      const result = await this.service.login(email, password);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: errorMessage
      });
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, fullName } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Email, password, and full name are required'
        });
      }

      // Basic validation
      if (password.length < 6) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Password must be at least 6 characters long'
        });
      }

      if (!email.includes('@')) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Invalid email format'
        });
      }

      const result = await this.service.register(email, password, fullName);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      res.status(StatusCodes.BAD_REQUEST).json({
        error: errorMessage
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      await this.service.logout();
      res.status(StatusCodes.OK).json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const user = await this.service.getCurrentUser(userId);
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      console.error('Get current user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user information';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { fullName, avatarUrl } = req.body;
      const updatedUser = await this.service.updateProfile(userId, {
        full_name: fullName,
        avatar_url: avatarUrl
      });

      res.status(StatusCodes.OK).json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role } = req.body;
      const user = await this.service.createUser(email, password, fullName, role);
      res.status(StatusCodes.CREATED).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      res.status(StatusCodes.BAD_REQUEST).json({
        error: errorMessage
      });
    }
  };

  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.service.getUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      console.error('Get users error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get users';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { email, fullName, role } = req.body;
      const user = await this.service.updateUser(id, { email, full_name: fullName, role });
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      console.error('Update user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.deleteUser(id);
      res.status(StatusCodes.OK).json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  banUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.banUser(id);
      res.status(StatusCodes.OK).json({
        message: 'User banned successfully'
      });
    } catch (error) {
      console.error('Ban user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to ban user';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  unbanUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.unbanUser(id);
      res.status(StatusCodes.OK).json({
        message: 'User unbanned successfully'
      });
    } catch (error) {
      console.error('Unban user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unban user';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };
}