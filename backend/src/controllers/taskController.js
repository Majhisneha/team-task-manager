const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper to get user's role in a project
const getUserRole = (project, userId) => {
  const member = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// @desc    Create a task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Admin)
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const project = req.project;
    const role = getUserRole(project, req.user._id);
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    const { title, description, dueDate, priority, assignedTo } = req.body;

    // Validate assignedTo is a project member
    if (assignedTo) {
      const isMember = project.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority: priority || 'Medium',
      status: 'To Do',
      project: project._id,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private (member)
const getTasks = async (req, res) => {
  try {
    const project = req.project;
    const role = getUserRole(project, req.user._id);

    let query = { project: project._id };

    // Members only see their assigned tasks
    if (role === 'Member') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/projects/:projectId/tasks/:taskId
// @access  Private (member)
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.projectId,
    })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = getUserRole(req.project, req.user._id);
    if (
      role === 'Member' &&
      task.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/projects/:projectId/tasks/:taskId
// @access  Private (Admin: all fields; Member: status only if assigned)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.projectId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = getUserRole(req.project, req.user._id);

    if (role === 'Member') {
      // Members can only update status of their assigned tasks
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: 'Members can only update task status' });
      if (!['To Do', 'In Progress', 'Done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      task.status = status;
    } else {
      // Admin can update all fields
      const { title, description, dueDate, priority, status, assignedTo } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority) task.priority = priority;
      if (status) task.status = status;
      if (assignedTo !== undefined) {
        if (assignedTo) {
          const isMember = req.project.members.some(
            (m) => m.user.toString() === assignedTo
          );
          if (!isMember) return res.status(400).json({ message: 'Assigned user is not a project member' });
        }
        task.assignedTo = assignedTo || null;
      }
    }

    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/projects/:projectId/tasks/:taskId
// @access  Private (Admin)
const deleteTask = async (req, res) => {
  try {
    const role = getUserRole(req.project, req.user._id);
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      project: req.params.projectId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
