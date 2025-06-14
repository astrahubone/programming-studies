import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { SubscriptionController } from '../controllers/subscription.controller.js';

export const subscriptionRouter = Router();
const controller = new SubscriptionController();

// All routes require authentication
subscriptionRouter.use(authenticate);

// Subscription management
subscriptionRouter.get('/current', controller.getCurrentSubscription);
subscriptionRouter.post('/checkout', controller.createCheckoutSession);
subscriptionRouter.post('/portal', controller.createPortalSession);
subscriptionRouter.post('/webhook', controller.handleWebhook);