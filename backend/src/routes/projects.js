const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  addMember,
  removeMember,
  deleteProject,
} = require('../controllers/projectController');
const { protect, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(
    [body('name').trim().notEmpty().withMessage('Project name is required')],
    createProject
  );

router.get('/:projectId', getProject);

router.post('/:projectId/members', requireProjectAdmin, addMember);
router.delete('/:projectId/members/:userId', requireProjectAdmin, removeMember);
router.delete('/:projectId', requireProjectAdmin, deleteProject);

module.exports = router;
