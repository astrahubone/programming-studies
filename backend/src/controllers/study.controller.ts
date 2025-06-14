import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StudyService } from '../services/study.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class StudyController {
  private service: StudyService;

  constructor() {
    this.service = new StudyService();
  }

  getStudySessions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const sessions = await this.service.getStudySessions(userId);
      res.status(StatusCodes.OK).json(sessions);
    } catch (error) {
      console.error('Get study sessions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get study sessions'
      });
    }
  };

  createStudySession = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { subSubjectId, scheduledDate } = req.body;
      const session = await this.service.createStudySession(userId, {
        sub_subject_id: subSubjectId,
        scheduled_date: scheduledDate
      });
      res.status(StatusCodes.CREATED).json(session);
    } catch (error) {
      console.error('Create study session error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Failed to create study session'
      });
    }
  };

  updateStudySession = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const updates = req.body;
      const session = await this.service.updateStudySession(userId, id, updates);
      res.status(StatusCodes.OK).json(session);
    } catch (error) {
      console.error('Update study session error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update study session'
      });
    }
  };

  deleteStudySession = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      await this.service.deleteStudySession(userId, id);
      res.status(StatusCodes.OK).json({
        message: 'Study session deleted successfully'
      });
    } catch (error) {
      console.error('Delete study session error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete study session'
      });
    }
  };

  getQuestions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { subSubjectId } = req.params;
      const questions = await this.service.getQuestions(userId, subSubjectId);
      res.status(StatusCodes.OK).json(questions);
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get questions'
      });
    }
  };

  generateQuestions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { subSubjectId } = req.params;
      const questions = await this.service.generateQuestions(userId, subSubjectId);
      res.status(StatusCodes.OK).json(questions);
    } catch (error) {
      console.error('Generate questions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to generate questions'
      });
    }
  };

  submitQuestions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { sessionId } = req.params;
      const { answers } = req.body;
      const result = await this.service.submitQuestions(userId, sessionId, answers);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error('Submit questions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to submit questions'
      });
    }
  };

  resetStudyData = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      await this.service.resetStudyData(userId);
      res.status(StatusCodes.OK).json({
        message: 'Study data reset successfully'
      });
    } catch (error) {
      console.error('Reset study data error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to reset study data'
      });
    }
  };

  getPerformanceStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const stats = await this.service.getPerformanceStats(userId);
      res.status(StatusCodes.OK).json(stats);
    } catch (error) {
      console.error('Get performance stats error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get performance statistics'
      });
    }
  };
}