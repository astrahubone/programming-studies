import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StudyConfigService } from '../services/studyConfig.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class StudyConfigController {
  private service: StudyConfigService;

  constructor() {
    this.service = new StudyConfigService();
  }

  getUserStudyConfig = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const config = await this.service.getUserStudyConfig(userId);
      res.status(StatusCodes.OK).json(config);
    } catch (error) {
      console.error('Get user study config error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get study configuration'
      });
    }
  };

  createStudyConfig = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const {
        startDate,
        studyDays,
        selectedTechnologies,
        generateSchedule = true
      } = req.body;

      if (!startDate || !studyDays || !selectedTechnologies || selectedTechnologies.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Start date, study days, and selected technologies are required'
        });
      }

      const config = await this.service.createStudyConfig(userId, {
        startDate,
        studyDays,
        selectedTechnologies,
        generateSchedule
      });

      res.status(StatusCodes.CREATED).json(config);
    } catch (error) {
      console.error('Create study config error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        error: error instanceof Error ? error.message : 'Failed to create study configuration'
      });
    }
  };

  updateStudyConfig = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const updates = req.body;

      const config = await this.service.updateStudyConfig(userId, id, updates);
      
      if (!config) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Study configuration not found'
        });
      }

      res.status(StatusCodes.OK).json(config);
    } catch (error) {
      console.error('Update study config error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update study configuration'
      });
    }
  };

  deleteStudyConfig = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      await this.service.deleteStudyConfig(userId, id);
      
      res.status(StatusCodes.OK).json({
        message: 'Study configuration deleted successfully'
      });
    } catch (error) {
      console.error('Delete study config error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete study configuration'
      });
    }
  };

  resetStudySchedule = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const result = await this.service.resetStudySchedule(userId);
      
      res.status(StatusCodes.OK).json({
        message: 'Study schedule reset successfully',
        ...result
      });
    } catch (error) {
      console.error('Reset study schedule error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error instanceof Error ? error.message : 'Failed to reset study schedule'
      });
    }
  };

  generateStudySchedule = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const schedule = await this.service.generateStudySchedule(userId, id);
      
      res.status(StatusCodes.OK).json({
        message: 'Study schedule generated successfully',
        sessionsCreated: schedule.length,
        schedule
      });
    } catch (error) {
      console.error('Generate study schedule error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error instanceof Error ? error.message : 'Failed to generate study schedule'
      });
    }
  };

  getStudySchedule = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const { startDate, endDate, page = 1, limit = 50 } = req.query;

      const schedule = await this.service.getStudySchedule(userId, id, {
        startDate: startDate as string,
        endDate: endDate as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.status(StatusCodes.OK).json(schedule);
    } catch (error) {
      console.error('Get study schedule error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get study schedule'
      });
    }
  };

  getStudyStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const stats = await this.service.getStudyStats(userId, id);
      
      res.status(StatusCodes.OK).json(stats);
    } catch (error) {
      console.error('Get study stats error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get study statistics'
      });
    }
  };

  getUserStudySessions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { 
        startDate, 
        endDate, 
        technologyId, 
        completed, 
        page = 1, 
        limit = 50 
      } = req.query;

      const sessions = await this.service.getUserStudySessions(userId, {
        startDate: startDate as string,
        endDate: endDate as string,
        technologyId: technologyId as string,
        completed: completed === 'true' ? true : completed === 'false' ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.status(StatusCodes.OK).json(sessions);
    } catch (error) {
      console.error('Get user study sessions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get study sessions'
      });
    }
  };

  getStudySessionsForCalendar = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { startDate, endDate } = req.query;

      const sessions = await this.service.getStudySessionsForCalendar(userId, {
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      res.status(StatusCodes.OK).json(sessions);
    } catch (error) {
      console.error('Get study sessions for calendar error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get study sessions for calendar'
      });
    }
  };

  completeStudySession = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { sessionId } = req.params;
      const { notes } = req.body;

      const session = await this.service.completeStudySession(userId, sessionId, notes);
      
      if (!session) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Study session not found'
        });
      }

      res.status(StatusCodes.OK).json(session);
    } catch (error) {
      console.error('Complete study session error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to complete study session'
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

      const { sessionId } = req.params;
      const updates = req.body;

      const session = await this.service.updateStudySession(userId, sessionId, updates);
      
      if (!session) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Study session not found'
        });
      }

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

      const { sessionId } = req.params;
      await this.service.deleteStudySession(userId, sessionId);
      
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

  bulkCompleteStudySessions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { sessionIds, notes } = req.body;

      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Session IDs array is required'
        });
      }

      const result = await this.service.bulkCompleteStudySessions(userId, sessionIds, notes);
      
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error('Bulk complete study sessions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to complete study sessions'
      });
    }
  };

  bulkDeleteStudySessions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { sessionIds } = req.body;

      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Session IDs array is required'
        });
      }

      const result = await this.service.bulkDeleteStudySessions(userId, sessionIds);
      
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error('Bulk delete study sessions error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete study sessions'
      });
    }
  };
}