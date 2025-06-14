import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from '../middleware/auth.js';
import { SubSubjectsService } from '../services/sub-subjects.service.js';

export class SubSubjectsController {
  private service: SubSubjectsService;

  constructor() {
    this.service = new SubSubjectsService();
  }

  getSubSubjects = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { subjectId } = req.params;
      const subSubjects = await this.service.getSubSubjects(userId, subjectId);
      res.status(StatusCodes.OK).json(subSubjects);
    } catch (error) {
      console.error('Get sub-subjects error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get sub-subjects';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  createSubSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { subjectId } = req.params;
      const { title, difficulty } = req.body;
      const subSubject = await this.service.createSubSubject(userId, subjectId, {
        title,
        difficulty
      });
      res.status(StatusCodes.CREATED).json(subSubject);
    } catch (error) {
      console.error('Create sub-subject error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create sub-subject';
      res.status(StatusCodes.BAD_REQUEST).json({
        error: errorMessage
      });
    }
  };

  updateSubSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const updates = req.body;
      const subSubject = await this.service.updateSubSubject(userId, id, updates);
      res.status(StatusCodes.OK).json(subSubject);
    } catch (error) {
      console.error('Update sub-subject error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update sub-subject';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };

  deleteSubSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      await this.service.deleteSubSubject(userId, id);
      res.status(StatusCodes.OK).json({
        message: 'Sub-subject deleted successfully'
      });
    } catch (error) {
      console.error('Delete sub-subject error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete sub-subject';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: errorMessage
      });
    }
  };
}