import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { TechnologiesController } from '../controllers/technologies.controller.js';

export const technologiesRouter = Router();
const controller = new TechnologiesController();

// All routes require authentication
technologiesRouter.use(authenticate);

// Technologies routes
technologiesRouter.get('/', controller.getTechnologies);
technologiesRouter.get('/:id', controller.getTechnologyById);
technologiesRouter.post('/', controller.createTechnology);
technologiesRouter.put('/:id', controller.updateTechnology);
technologiesRouter.delete('/:id', controller.deleteTechnology);

// Technology subtopics routes
technologiesRouter.get('/:id/subtopics', controller.getTechnologySubtopics);
technologiesRouter.post('/:id/subtopics', controller.createTechnologySubtopic);
technologiesRouter.put('/subtopics/:subtopicId', controller.updateTechnologySubtopic);
technologiesRouter.delete('/subtopics/:subtopicId', controller.deleteTechnologySubtopic);

// Admin only routes
technologiesRouter.post('/admin/seed', controller.seedTechnologies);
technologiesRouter.put('/admin/:id/toggle-status', controller.toggleTechnologyStatus);