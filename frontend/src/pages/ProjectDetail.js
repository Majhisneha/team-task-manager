import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const statusBadge = (s) => {
  const map = { 'To Do': 'badge-todo', 'In Progress': 'badge-inprogress', Done: 'badge-done' };
  return `badge ${map[s] || 'badge-todo'}`;
};

const priorityBadge = (p) => {
  const map = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' };
  return `badge ${map[p] || 'badge-medium'}`;
};

const isOverdue = (task) =>
  task.dueDate &&
  task.status !== 'Done' &&
  new Date(task.dueDate) < new Date();

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '',
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Member management
  const [memberEmail, setMemberEmail] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');

  const myRole = project?.members.find((m) => m.user._id === user._id)?.role || 'Member';
  const isAdmin = myRole === 'Admin';

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsAPI.getOne(projectId),
        tasksAPI.getAll(projectId),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/');
      }
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo?._id || '',
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskError('');
    setTaskLoading(true);
    try {
      const payload = { ...taskForm };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;

      if (editTask) {
        if (!isAdmin) {
          // Member: only update status
          const { data } = await tasksAPI.update(projectId, editTask._id, { status: payload.status });
          setTasks(tasks.map((t) => (t._id === data._id ? data : t)));
        } else {
          const { data } = await tasksAPI.update(projectId, editTask._id, payload);
          setTasks(tasks.map((t) => (t._id === data._id ? data : t)));
        }
      } else {
        const { data } = await tasksAPI.create(projectId, payload);
        setTasks([data, ...tasks]);
      }
      setShowTaskModal(false);
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(projectId, taskId);
      setTasks(tasks.filter((t) => t._id !== taskId));
    } catch {
      setError('Failed to delete task');
    }
  };

  const handleQuickStatus = async (task, newStatus) => {
    try {
      const { data } = await tasksAPI.update(projectId, task._id, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === data._id ? data : t)));
    } catch {
      setError('Failed to update status');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    setMemberSuccess('');
    setMemberLoading(true);
    try {
      const { data } = await projectsAPI.addMember(projectId, memberEmail);
      setProject(data);
      setMemberEmail('');
      setMemberSuccess('Member added successfully');
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const { data } = await projectsAPI.removeMember(projectId, userId);
      setProject(data);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectsAPI.delete(projectId);
      navigate('/');
    } catch {
      setError('Failed to delete project');
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="project-detail-header">
        <div className="breadcrumb">
          <Link to="/">Projects</Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <div className="header-actions">
          <div className="role-badge">
            <span className={`badge ${isAdmin ? 'badge-inprogress' : 'badge-todo'}`}>{myRole}</span>
          </div>
          {isAdmin && (
            <>
              <Link to={`/projects/${projectId}/dashboard`} className="btn btn-ghost">
                📊 Dashboard
              </Link>
              <button className="btn btn-primary" onClick={openCreateTask}>
                + Add Task
              </button>
            </>
          )}
        </div>
      </div>

      <div className="project-title-row">
        <h1>{project.name}</h1>
        {project.description && <p className="project-description">{project.description}</p>}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          Tasks ({tasks.length})
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          Members ({project.members.length})
        </button>
        {isAdmin && (
          <button className={`tab tab-danger ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            Settings
          </button>
        )}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="kanban">
          {STATUSES.map((status) => (
            <div key={status} className="kanban-column">
              <div className="kanban-header">
                <span className={`badge ${statusBadge(status).replace('badge ', '')}`}>{status}</span>
                <span className="task-count">{tasksByStatus[status].length}</span>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus[status].length === 0 ? (
                  <div className="kanban-empty">No tasks</div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <div key={task._id} className={`task-card ${isOverdue(task) ? 'overdue' : ''}`}>
                      {isOverdue(task) && <div className="overdue-banner">⚠ Overdue</div>}
                      <div className="task-card-header">
                        <h4>{task.title}</h4>
                        <div className="task-card-actions">
                          <button className="icon-btn" onClick={() => openEditTask(task)} title="Edit">✏</button>
                          {isAdmin && (
                            <button className="icon-btn danger" onClick={() => handleDeleteTask(task._id)} title="Delete">✕</button>
                          )}
                        </div>
                      </div>
                      {task.description && <p className="task-desc">{task.description}</p>}
                      <div className="task-meta">
                        <span className={priorityBadge(task.priority)}>{task.priority}</span>
                        {task.dueDate && (
                          <span className="due-date">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {task.assignedTo && (
                        <div className="task-assignee">
                          <span className="assignee-avatar">{task.assignedTo.name.charAt(0)}</span>
                          <span className="assignee-name">{task.assignedTo.name}</span>
                        </div>
                      )}
                      {/* Quick status buttons */}
                      <div className="quick-status">
                        {STATUSES.filter((s) => s !== task.status).map((s) => (
                          <button
                            key={s}
                            className="quick-status-btn"
                            onClick={() => handleQuickStatus(task, s)}
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="members-section">
          {isAdmin && (
            <div className="card add-member-form">
              <h3>Add Member</h3>
              {memberError && <div className="error-msg" style={{ marginBottom: 12 }}>{memberError}</div>}
              {memberSuccess && (
                <div className="success-msg" style={{ marginBottom: 12 }}>{memberSuccess}</div>
              )}
              <form onSubmit={handleAddMember} className="inline-form">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={memberLoading}>
                  {memberLoading ? 'Adding...' : 'Add Member'}
                </button>
              </form>
            </div>
          )}

          <div className="members-list">
            {project.members.map((m) => (
              <div key={m.user._id} className="member-row">
                <div className="member-info">
                  <div className="member-avatar">{m.user.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="member-name">{m.user.name}</div>
                    <div className="member-email">{m.user.email}</div>
                  </div>
                </div>
                <div className="member-right">
                  <span className={`badge ${m.role === 'Admin' ? 'badge-inprogress' : 'badge-todo'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.user._id !== user._id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && isAdmin && (
        <div className="settings-section">
          <div className="card danger-zone">
            <h3>Danger Zone</h3>
            <p>Deleting this project will permanently remove all tasks and data. This action cannot be undone.</p>
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editTask ? 'Edit Task' : 'Create Task'}</h2>
            {taskError && <div className="error-msg" style={{ marginBottom: 12 }}>{taskError}</div>}
            <form onSubmit={handleTaskSubmit} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title"
                  required
                  disabled={!isAdmin}
                />
              </div>
              {isAdmin && (
                <>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Assign To</label>
                      <select
                        value={taskForm.assignedTo}
                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {project.members.map((m) => (
                          <option key={m.user._id} value={m.user._id}>
                            {m.user.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={taskForm.status}
                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      >
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
              {/* Member can only change status */}
              {!isAdmin && editTask && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={taskLoading}>
                  {taskLoading ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
