import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Folder, 
  CheckSquare, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Plus,
  Loader
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data States
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch User Profile
        const userRes = await api.get('/auth/me');
        const currentUser = userRes.data.data;
        setUser(currentUser);

        // 2. Fetch Statistics (Backend now returns global data if super_admin)
        const statsRes = await api.get('/stats/dashboard');
        const s = statsRes.data.data;

        setStats([
            { label: 'Total Projects', value: s.totalProjects.toString(), icon: Folder, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Tasks', value: s.totalTasks.toString(), icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Completed', value: s.completedTasks.toString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending', value: s.pendingTasks.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ]);

        // 3. Fetch Recent Projects (Backend now returns all projects if super_admin)
        const projectsRes = await api.get('/projects?limit=5');
        const recentProjects = projectsRes.data.data.projects;

        const taskCountsRes = await api.get('/stats/project-tasks');
        const countsMap = taskCountsRes.data.data;

        const mergedProjects = recentProjects.map(p => {
          const countData = countsMap.find(c => c.id === p.id);
          return { ...p, taskCount: countData ? countData.taskCount : 0 };
        });

        setProjects(mergedProjects);

        // 4. Fetch Tasks Preview
        if (mergedProjects.length > 0) {
            const recentProjectId = mergedProjects[0].id;
            
            // --- SUPER ADMIN LOGIC CHANGE ---
            // If super_admin, do NOT filter by assignedTo. Show all tasks for that project.
            let tasksUrl = `/projects/${recentProjectId}/tasks`;
            if (currentUser.role !== 'super_admin') {
                tasksUrl += `?assignedTo=${currentUser.id}`;
            }

            const tasksRes = await api.get(tasksUrl);
            setTasks(tasksRes.data.data.tasks || []);
        }

      } catch (error) {
        console.error("Dashboard Load Error:", error);
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
                {user.role === 'super_admin' ? 'System Overview' : 'Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, <span className="font-semibold text-indigo-600">{user?.fullName}</span> 👋 
              {user.role === 'super_admin' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">System Admin</span>}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
               Workspace: {user?.tenant?.name || 'System Wide'}
            </p>
          </div>
          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md border shadow-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* 1. STATISTICS CARDS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-lg p-3 ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
                        {user.role === 'super_admin' ? `Global ${stat.label}` : stat.label}
                      </dt>
                      <dd className="text-2xl font-extrabold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. RECENT PROJECTS SECTION */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[350px]">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">
                {user.role === 'super_admin' ? 'All Organization Projects' : 'Recent Projects'}
              </h3>
              <Link to="/projects" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-2 py-1 rounded">
                VIEW ALL <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
            
            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Name</th>
                            {user.role === 'super_admin' && <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organization</th>}
                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {projects.map((project) => (
                            <tr 
                              key={project.id} 
                              className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" 
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-indigo-600">
                                  {project.name}
                                </td>
                                {user.role === 'super_admin' && (
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-indigo-500 uppercase">
                                        {project.organization || 'System'}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter
                                        ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                    {project.taskCount || 0} <span className="text-[10px] font-normal text-gray-400 italic">Tasks</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          {/* 3. MY TASKS SECTION */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[350px]">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">
                {user.role === 'super_admin' ? 'Project Tasks' : 'My Tasks'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                {user.role === 'super_admin' ? 'Recent Activity Preview' : 'Assigned to you'}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-50">
                    {tasks.map((task) => (
                        <div key={task.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                             <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm
                                        ${task.priority === 'high' ? 'bg-red-50 text-red-600' : 
                                          task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 
                                          'bg-blue-50 text-blue-600'}`}>
                                        {task.priority}
                                    </span>
                                </div>
                             </div>
                             <div className={`h-2 w-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                        </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-sm italic font-medium">
                        No activity found.
                      </div>
                    )}
                </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;