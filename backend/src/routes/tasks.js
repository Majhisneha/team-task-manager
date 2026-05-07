const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, requireProjectMember } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireProjectMember);

router
  .route('/')
  .get(getTasks)
  .post(
    [body('title').trim().notEmpty().withMessage('Task title is required')],
    createTask
  );

router
  .route('/:taskId')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
