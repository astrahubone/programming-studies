import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TechnologiesService } from '../services/technologies.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class TechnologiesController {
  private service: TechnologiesService;

  constructor() {
    this.service = new TechnologiesService();
  }

  getTechnologies = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const technologies = await this.service.getTechnologies();
      res.status(StatusCodes.OK).json(technologies);
    } catch (error) {
      console.error('Get technologies error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get technologies'
      });
    }
  };

  getTechnologyById = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const technology = await this.service.getTechnologyById(id);
      
      if (!technology) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Technology not found'
        });
      }

      res.status(StatusCodes.OK).json(technology);
    } catch (error) {
      console.error('Get technology by ID error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get technology'
      });
    }
  };

  createTechnology = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { name, description, icon_name } = req.body;
      
      if (!name || !icon_name) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Name and icon_name are required'
        });
      }

      const technology = await this.service.createTechnology({
        name,
        description,
        icon_name
      });

      res.status(StatusCodes.CREATED).json(technology);
    } catch (error) {
      console.error('Create technology error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Failed to create technology'
      });
    }
  };

  updateTechnology = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { id } = req.params;
      const updates = req.body;
      
      const technology = await this.service.updateTechnology(id, updates);
      
      if (!technology) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Technology not found'
        });
      }

      res.status(StatusCodes.OK).json(technology);
    } catch (error) {
      console.error('Update technology error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update technology'
      });
    }
  };

  deleteTechnology = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { id } = req.params;
      await this.service.deleteTechnology(id);
      
      res.status(StatusCodes.OK).json({
        message: 'Technology deleted successfully'
      });
    } catch (error) {
      console.error('Delete technology error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete technology'
      });
    }
  };

  getTechnologySubtopics = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      const { id } = req.params;
      const subtopics = await this.service.getTechnologySubtopics(id);
      res.status(StatusCodes.OK).json(subtopics);
    } catch (error) {
      console.error('Get technology subtopics error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get technology subtopics'
      });
    }
  };

  createTechnologySubtopic = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { id } = req.params;
      const { name, description, hours_required, difficulty_level, order_index } = req.body;
      
      if (!name || !hours_required) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Name and hours_required are required'
        });
      }

      const subtopic = await this.service.createTechnologySubtopic(id, {
        name,
        description,
        hours_required,
        difficulty_level: difficulty_level || 'iniciante',
        order_index: order_index || 0
      });

      res.status(StatusCodes.CREATED).json(subtopic);
    } catch (error) {
      console.error('Create technology subtopic error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Failed to create technology subtopic'
      });
    }
  };

  updateTechnologySubtopic = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { subtopicId } = req.params;
      const updates = req.body;
      
      const subtopic = await this.service.updateTechnologySubtopic(subtopicId, updates);
      
      if (!subtopic) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Technology subtopic not found'
        });
      }

      res.status(StatusCodes.OK).json(subtopic);
    } catch (error) {
      console.error('Update technology subtopic error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update technology subtopic'
      });
    }
  };

  deleteTechnologySubtopic = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { subtopicId } = req.params;
      await this.service.deleteTechnologySubtopic(subtopicId);
      
      res.status(StatusCodes.OK).json({
        message: 'Technology subtopic deleted successfully'
      });
    } catch (error) {
      console.error('Delete technology subtopic error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete technology subtopic'
      });
    }
  };

  seedTechnologies = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const result = await this.service.seedTechnologies();
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error('Seed technologies error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to seed technologies'
      });
    }
  };

  toggleTechnologyStatus = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'User not authenticated'
        });
      }

      // Check if user is admin
      const isAdmin = await this.service.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Admin permission required'
        });
      }

      const { id } = req.params;
      const technology = await this.service.toggleTechnologyStatus(id);
      
      if (!technology) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Technology not found'
        });
      }

      res.status(StatusCodes.OK).json(technology);
    } catch (error) {
      console.error('Toggle technology status error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to toggle technology status'
      });
    }
  };
}