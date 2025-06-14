import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SubjectsService } from '../services/subjects.service.js';
import { SubSubjectsService } from '../services/sub-subjects.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class SubjectsController {
  private subjectsService: SubjectsService;
  private subSubjectsService: SubSubjectsService;

  constructor() {
    this.subjectsService = new SubjectsService();
    this.subSubjectsService = new SubSubjectsService();
  }

  getSubjects = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const subjects = await this.subjectsService.getSubjects(userId);
      res.status(StatusCodes.OK).json(subjects);
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get subjects' });
    }
  };

  createSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { title, color, sub_subjects } = req.body;
      const subject = await this.subjectsService.createSubject(userId, { title, color, sub_subjects });
      res.status(StatusCodes.CREATED).json(subject);
    } catch (error) {
      console.error('Create subject error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to create subject' });
    }
  };

  updateSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const updates = req.body;
      const subject = await this.subjectsService.updateSubject(userId, id, updates);
      res.status(StatusCodes.OK).json(subject);
    } catch (error) {
      console.error('Update subject error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update subject' });
    }
  };

  deleteSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      await this.subjectsService.deleteSubject(userId, id);
      res.status(StatusCodes.OK).json({ message: 'Subject deleted successfully' });
    } catch (error) {
      console.error('Delete subject error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete subject' });
    }
  };

  getSubSubjects = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { subjectId } = req.params;
      const subSubjects = await this.subSubjectsService.getSubSubjects(userId, subjectId);
      res.status(StatusCodes.OK).json(subSubjects);
    } catch (error) {
      console.error('Get sub-subjects error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get sub-subjects' });
    }
  };

  createSubSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { subjectId } = req.params;
      const { title, difficulty } = req.body;
      const subSubject = await this.subSubjectsService.createSubSubject(userId, subjectId, { title, difficulty });
      res.status(StatusCodes.CREATED).json(subSubject);
    } catch (error) {
      console.error('Create sub-subject error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to create sub-subject' });
    }
  };

  updateSubSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const updates = req.body;
      const subSubject = await this.subSubjectsService.updateSubSubject(userId, id, updates);
      res.status(StatusCodes.OK).json(subSubject);
    } catch (error) {
      console.error('Update sub-subject error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update sub-subject' });
    }
  };

  deleteSubSubject = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      await this.subSubjectsService.deleteSubSubject(userId, id);
      res.status(StatusCodes.OK).json({ message: 'Sub-subject deleted successfully' });
    } catch (error) {
      console.error('Delete sub-subject error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete sub-subject' });
    }
  };
}
