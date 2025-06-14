import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { AdminController } from '../controllers/admin.controller.js';

export const adminRouter = Router();
const controller = new AdminController();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireAdmin);

// Dashboard
adminRouter.get('/dashboard/stats', controller.getDashboardStats);

// Users
adminRouter.get('/users', controller.getUsers);
adminRouter.post('/users', controller.createUser);
adminRouter.put('/users/:id', controller.updateUser);
adminRouter.delete('/users/:id', controller.deleteUser);
adminRouter.post('/users/:id/ban', controller.banUser);
adminRouter.post('/users/:id/unban', controller.unbanUser);
adminRouter.post('/users/:id/promote', controller.promoteToAdmin);
adminRouter.post('/users/:id/demote', controller.demoteFromAdmin);

// Subscriptions
adminRouter.get('/subscriptions', controller.getSubscriptions);
adminRouter.post('/subscriptions/:id/cancel', controller.cancelSubscription);

// Performance
adminRouter.get('/performance/users', controller.getUsersPerformance);
adminRouter.get('/performance/daily', controller.getDailyStats);