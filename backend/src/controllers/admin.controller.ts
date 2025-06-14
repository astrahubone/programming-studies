import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AdminService } from '../services/admin.service.js';

export class AdminController {
  private service: AdminService;

  constructor() {
    this.service = new AdminService();
  }

  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.service.getDashboardStats();
      res.status(StatusCodes.OK).json(stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get dashboard statistics'
      });
    }
  };

  getUsers = async (req: Request, res: Response) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 10,
        search: req.query.search as string,
        role: req.query.role as string,
        status: req.query.status as string
      };
      const users = await this.service.getUsers(filters);
      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get users'
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
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Failed to create user'
      });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await this.service.updateUser(id, updates);
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update user'
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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete user'
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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to ban user'
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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to unban user'
      });
    }
  };

  promoteToAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.service.promoteToAdmin(id);
      res.status(StatusCodes.OK).json({
        message: 'User promoted to admin successfully',
        user
      });
    } catch (error) {
      console.error('Promote to admin error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to promote user to admin'
      });
    }
  };

  demoteFromAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.service.demoteFromAdmin(id);
      res.status(StatusCodes.OK).json({
        message: 'Admin demoted to regular user successfully',
        user
      });
    } catch (error) {
      console.error('Demote from admin error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to demote admin to user'
      });
    }
  };

  getSubscriptions = async (req: Request, res: Response) => {
    try {
      const subscriptions = await this.service.getSubscriptions();
      res.status(StatusCodes.OK).json(subscriptions);
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get subscriptions'
      });
    }
  };

  cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.cancelSubscription(id);
      res.status(StatusCodes.OK).json({
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to cancel subscription'
      });
    }
  };

  getUsersPerformance = async (req: Request, res: Response) => {
    try {
      const performance = await this.service.getUsersPerformance();
      res.status(StatusCodes.OK).json(performance);
    } catch (error) {
      console.error('Get users performance error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get users performance'
      });
    }
  };

  getDailyStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.service.getDailyStats();
      res.status(StatusCodes.OK).json(stats);
    } catch (error) {
      console.error('Get daily stats error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get daily statistics'
      });
    }
  };
}