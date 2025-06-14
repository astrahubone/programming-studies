import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from '../middleware/auth.js';
import { SubscriptionService } from '../services/subscription.service.js';

export class SubscriptionController {
  private service: SubscriptionService;

  constructor() {
    this.service = new SubscriptionService();
  }

  getCurrentSubscription = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const subscription = await this.service.getCurrentSubscription(userId);
      res.status(StatusCodes.OK).json(subscription);
    } catch (error) {
      console.error('Get current subscription error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get current subscription'
      });
    }
  };

  createCheckoutSession = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { priceId } = req.body;
      const session = await this.service.createCheckoutSession(userId, priceId);
      res.status(StatusCodes.OK).json({ sessionId: session.id });
    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create checkout session'
      });
    }
  };

  createPortalSession = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { url } = await this.service.createPortalSession(userId);
      res.status(StatusCodes.OK).json({ url });
    } catch (error) {
      console.error('Create portal session error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create portal session'
      });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const sig: any = req.headers['stripe-signature'];
      if (!sig) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Missing stripe signature'
        });
      }

      await this.service.handleWebhook(req.body, sig);
      res.status(StatusCodes.OK).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Webhook error'
      });
    }
  };
}