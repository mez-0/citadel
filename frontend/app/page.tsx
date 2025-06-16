'use client';
import { useState, useEffect } from 'react';
import { ThreatDistributionChart } from '@/components/charts/ThreatDistributionChart';
import { DefenderAnalysisChart } from '@/components/charts/DefenderAnalysisChart';
import { RecentTasksGrid } from '@/components/grids/RecentTasksGrid';
import { Task, ThreatData, DefenderData, DashboardStats } from '@/lib/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  const [defenderData, setDefenderData] = useState<DefenderData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    failedTasks: 0,
    threatsDetected: 0,
    cleanFiles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [tasksRes, threatsRes, defenderRes, statsRes] = await Promise.all([
          fetch('/api/tasks?limit=20'),
          fetch('/api/dashboard/threats'),
          fetch('/api/dashboard/defender'),
          fetch('/api/dashboard/stats')
        ]);

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks || []);
        }

        if (threatsRes.ok) {
          const threats = await threatsRes.json();
          setThreatData(threats);
        }

        if (defenderRes.ok) {
          const defender = await defenderRes.json();
          setDefenderData(defender);
        }

        if (statsRes.ok) {
          const dashboardStats = await statsRes.json();
          setStats(dashboardStats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container-fluid px-4 py-6">
        {/* Key Metrics */}
        <div className="row g-4 mb-4">
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-primary mb-2">
                  <i className="bi bi-files fs-1"></i>
                </div>
                <h3 className="text-white mb-1">{stats.totalTasks.toLocaleString()}</h3>
                <p className="text-gray-400 mb-0 small">Total Files</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-check-circle fs-1"></i>
                </div>
                <h3 className="text-white mb-1">{stats.completedTasks.toLocaleString()}</h3>
                <p className="text-gray-400 mb-0 small">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-warning mb-2">
                  <i className="bi bi-clock fs-1"></i>
                </div>
                <h3 className="text-white mb-1">{stats.pendingTasks.toLocaleString()}</h3>
                <p className="text-gray-400 mb-0 small">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-danger mb-2">
                  <i className="bi bi-exclamation-triangle fs-1"></i>
                </div>
                <h3 className="text-white mb-1">{stats.threatsDetected.toLocaleString()}</h3>
                <p className="text-gray-400 mb-0 small">Threats Detected</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-shield-check fs-1"></i>
                </div>
                <h3 className="text-white mb-1">{stats.cleanFiles.toLocaleString()}</h3>
                <p className="text-gray-400 mb-0 small">Clean Files</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-info mb-2">
                  <i className="bi bi-graph-up fs-1"></i>
                </div>
                <h3 className="text-white mb-1">
                  {stats.totalTasks > 0 ? Math.round((stats.threatsDetected / stats.totalTasks) * 100) : 0}%
                </h3>
                <p className="text-gray-400 mb-0 small">Detection Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-header bg-gray-800 border-gray-700">
                <h5 className="card-title text-white mb-0">
                  <i className="bi bi-pie-chart me-2"></i>
                  Threat Distribution
                </h5>
              </div>
              <div className="card-body">
                <ThreatDistributionChart data={threatData} />
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-header bg-gray-800 border-gray-700">
                <h5 className="card-title text-white mb-0">
                  <i className="bi bi-bar-chart me-2"></i>
                  Defender Analysis
                </h5>
              </div>
              <div className="card-body">
                <DefenderAnalysisChart data={defenderData} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="row">
          <div className="col-12">
            <div className="card bg-gray-800 border-gray-700">
              <div className="card-header bg-gray-800 border-gray-700">
                <h5 className="card-title text-white mb-0">
                  <i className="bi bi-list-task me-2"></i>
                  Recent Analysis Tasks
                </h5>
              </div>
              <div className="card-body p-0">
                <RecentTasksGrid tasks={tasks} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
