import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { AuthController } from '../controllers/auth.controller.js';

export const authRouter = Router();
const controller = new AuthController();

// Public routes
authRouter.post('/login', controller.login);
authRouter.post('/register', controller.register);

// Protected routes
authRouter.use(authenticate);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', controller.getCurrentUser);
authRouter.put('/me', controller.updateProfile);

// Admin routes
authRouter.use(requireAdmin);
authRouter.post('/users', controller.createUser);
authRouter.get('/users', controller.getUsers);
authRouter.put('/users/:id', controller.updateUser);
authRouter.delete('/users/:id', controller.deleteUser);
authRouter.post('/users/:id/ban', controller.banUser);
authRouter.post('/users/:id/unban', controller.unbanUser);