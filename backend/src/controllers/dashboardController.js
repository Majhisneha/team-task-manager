const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard stats for a project
// @route   GET /api/projects/:projectId/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
  try {
    const project = req.project;
    const now = new Date();

    // Total tasks
    const totalTasks = await Task.countDocuments({ project: project._id });

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = { 'To Do': 0, 'In Progress': 0, Done: 0 };
    tasksByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    // Tasks per user
    const tasksPerUser = await Task.aggregate([
      { $match: { project: project._id, assignedTo: { $ne: null } } },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$assignedTo',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          count: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'To Do'] }, 1, 0] } },
        },
      },
    ]);

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      project: project._id,
      status: { $ne: 'Done' },
      dueDate: { $lt: now },
    });

    // Recent tasks
    const recentTasks = await Task.find({ project: project._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      totalTasks,
      tasksByStatus: statusMap,
      tasksPerUser,
      overdueTasks,
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboard };
