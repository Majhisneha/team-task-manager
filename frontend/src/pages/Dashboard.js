import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dashboardAPI, projectsAPI } from '../services/api';
import './Dashboard.css';

const StatCard = ({ label, value, color, icon }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const Dashboard = () => {
  const { projectId } = useParams();
  const [stats, setStats] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, projRes] = await Promise.all([
          dashboardAPI.get(projectId),
          projectsAPI.getOne(projectId),
        ]);
        setStats(dashRes.data);
        setProject(projRes.data);
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [projectId]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (error) return <div className="dashboard-page"><div className="error-msg">{error}</div></div>;

  const completionRate = stats.totalTasks
    ? Math.round((stats.tasksByStatus.Done / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="breadcrumb">
          <Link to="/">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`}>{project?.name}</Link>
          <span>/</span>
          <span>Dashboard</span>
        </div>
        <Link to={`/projects/${projectId}`} className="btn btn-ghost">
          ← Back to Project
        </Link>
      </div>

      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">{project?.name}</p>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Tasks" value={stats.totalTasks} color="blue" icon="📋" />
        <StatCard label="To Do" value={stats.tasksByStatus['To Do']} color="gray" icon="○" />
        <StatCard label="In Progress" value={stats.tasksByStatus['In Progress']} color="blue" icon="◑" />
        <StatCard label="Completed" value={stats.tasksByStatus.Done} color="green" icon="●" />
        <StatCard label="Overdue" value={stats.overdueTasks} color="red" icon="⚠" />
        <StatCard label="Completion" value={`${completionRate}%`} color="purple" icon="◎" />
      </div>

      {/* Progress Bar */}
      <div className="card progress-card">
        <div className="progress-header">
          <span>Overall Progress</span>
          <span className="progress-pct">{completionRate}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
        </div>
        <div className="status-breakdown">
          {Object.entries(stats.tasksByStatus).map(([status, count]) => (
            <div key={status} className="breakdown-item">
              <span className={`badge badge-${status.toLowerCase().replace(' ', '')}`}>{status}</span>
              <span className="breakdown-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Tasks per user */}
        {stats.tasksPerUser.length > 0 && (
          <div className="card">
            <h3>Tasks per User</h3>
            <div className="user-tasks-list">
              {stats.tasksPerUser.map((u) => (
                <div key={u._id} className="user-task-row">
                  <div className="user-task-info">
                    <div className="user-avatar-sm">{u.userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="user-task-name">{u.userName}</div>
                      <div className="user-task-email">{u.userEmail}</div>
                    </div>
                  </div>
                  <div className="user-task-stats">
                    <span className="badge badge-done">{u.done} done</span>
                    <span className="badge badge-inprogress">{u.inProgress} in prog</span>
                    <span className="badge badge-todo">{u.todo} todo</span>
                    <span className="user-total">{u.count} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent tasks */}
        {stats.recentTasks.length > 0 && (
          <div className="card">
            <h3>Recent Activity</h3>
            <div className="recent-tasks">
              {stats.recentTasks.map((t) => (
                <div key={t._id} className="recent-task-row">
                  <div className="recent-task-info">
                    <span className="recent-task-title">{t.title}</span>
                    <span className="recent-task-meta">
                      {t.assignedTo ? `→ ${t.assignedTo.name}` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="recent-task-badges">
                    <span className={`badge badge-${t.status.toLowerCase().replace(' ', '')}`}>{t.status}</span>
                    <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
