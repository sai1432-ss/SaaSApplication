import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api'; 
import { 
  CheckSquare, Search, Filter, Plus, MoreVertical, 
  Calendar, ArrowUp, ArrowDown, Edit, X, Save, Clock, ShieldAlert 
} from 'lucide-react';

const Tasks = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [teamMembers, setTeamMembers] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [formData, setFormData] = useState({ 
    title: '', projectId: '', assignee: '', status: 'todo', priority: 'medium', dueDate: '' 
  });

  // --- 1. SECURE FETCH DATA ---
  const fetchData = async () => {
    // A. CLIENT-SIDE AUTH CHECK: Check for token before making any calls
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
        // B. Get User Profile & Role
        const userRes = await api.get('/auth/me');
        const user = userRes.data.data;
        setCurrentUser(user);

        // ROLE CHECK: Restrict to Admins as requested
        if (user.role !== 'tenant_admin' && user.role !== 'super_admin') {
            setLoading(false);
            return;
        }

        // C. Get Tenant Team Members
        const tenantId = user.tenantId || user.tenant_id || (user.tenant && user.tenant.id);
        if (tenantId) {
            const usersRes = await api.get(`/tenants/${tenantId}/users`);
            setTeamMembers(usersRes.data.data.users);
        }

        // D. Get Projects & Tasks
        const projectsRes = await api.get('/projects?limit=100');
        const projectsList = projectsRes.data.data.projects;
        setProjects(projectsList);

        if (projectsList.length > 0) {
            const tasksPromises = projectsList.map(p => 
                api.get(`/projects/${p.id}/tasks`).catch(() => ({ data: { data: { tasks: [] } } }))
            );
            
            const responses = await Promise.all(tasksPromises);
            const allTasks = responses.flatMap((res, index) => {
                const project = projectsList[index];
                return (res.data?.data?.tasks || []).map(t => ({ 
                  ...t, 
                  projectName: project.name, 
                  projectId: project.id 
                }));
            });
            setTasks(allTasks);
        }
    } catch (err) {
        console.error("Task Page Error:", err);
        // SERVER-SIDE AUTH CHECK: If backend returns 401, clear local session
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. ACCESS DENIED UI ---
  if (!loading && currentUser && currentUser.role !== 'tenant_admin' && currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Only organization admins can manage the global tasks list.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 text-indigo-600 font-semibold hover:underline">
            Go back to Dashboard &rarr;
          </button>
        </div>
      </div>
    );
  }

  // --- 3. HANDLERS (Simplified) ---
  const openModal = (task = null) => {
    if (task) {
        setEditingTask(task);
        setFormData({
            title: task.title,
            projectId: task.projectId,
            assignee: task.assignedTo ? task.assignedTo.id : '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
        });
    } else {
        setEditingTask(null);
        setFormData({ title: '', projectId: projects.length > 0 ? projects[0].id : '', assignee: '', status: 'todo', priority: 'medium', dueDate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        if (!formData.projectId) return alert("Select a project.");
        const payload = { ...formData, assignedTo: formData.assignee || null };
        if (editingTask) await api.put(`/tasks/${editingTask.id}`, payload);
        else await api.post(`/projects/${formData.projectId}/tasks`, payload);
        setIsModalOpen(false);
        fetchData(); 
    } catch (err) {
        alert("Failed to save.");
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    let newStatus = currentStatus === 'todo' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'todo';
    try {
        await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
        console.error("Patch failed");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'My Tasks' && task.assignedTo?.id === currentUser?.id) ||
                          task.status === statusFilter.toLowerCase().replace(' ', '_');
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (priority) => {
    if (priority === 'high') return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs flex items-center"><ArrowUp className="w-3 h-3 mr-1"/> High</span>;
    if (priority === 'medium') return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs flex items-center"><ArrowUp className="w-3 h-3 mr-1 rotate-45"/> Medium</span>;
    return <span className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-xs flex items-center"><ArrowDown className="w-3 h-3 mr-1"/> Low</span>;
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => setActiveDropdown(null)}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization Tasks</h2>
            <p className="mt-1 text-sm text-gray-500">Secure management for Admins.</p>
          </div>
          <button onClick={() => openModal()} disabled={projects.length === 0} className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors ${projects.length === 0 ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </button>
        </div>

        <div className="bg-white p-4 rounded-t-xl border flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full rounded-md border-gray-300 py-2 pl-10 focus:ring-indigo-600 sm:text-sm" placeholder="Search organization tasks..." />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 py-2 focus:ring-indigo-600 sm:text-sm">
              <option>All</option><option>My Tasks</option><option>Todo</option><option>In Progress</option><option>Completed</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-t-0 rounded-b-xl overflow-hidden min-h-[400px]">
          {filteredTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500"><CheckSquare className="h-12 w-12 text-gray-200 mb-2" /><p>No organization tasks found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Task</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Project</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assignee</th>
                    <th className="relative px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 flex items-center">
                        <button onClick={() => handleStatusChange(task.id, task.status)} className={`w-4 h-4 mr-3 rounded border transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                            {task.status === 'completed' && <div className="w-2 h-2 bg-white rounded-sm mx-auto" />}
                        </button>
                        <span className={task.status === 'completed' ? 'text-gray-400 line-through' : ''}>{task.title}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-indigo-600">{task.projectName}</td>
                      <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{task.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700">{task.assignedTo?.fullName || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(task)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 transition-colors"><Edit className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL IS THE SAME BUT DISMISSES ON BACKGROUND CLICK AS PART OF SECURITY UI */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">{editingTask ? 'Edit Organization Task' : 'Create Task'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Target Project</label><select disabled={!!editingTask} value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value})} className="w-full rounded border-gray-300 text-sm">{projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
                <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label><input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full rounded border-gray-300 text-sm" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Priority</label><select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full rounded border-gray-300 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Due Date</label><input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full rounded border-gray-300 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full rounded border-gray-300 text-sm"><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Assignee</label><select value={formData.assignee} onChange={(e) => setFormData({...formData, assignee: e.target.value})} className="w-full rounded border-gray-300 text-sm"><option value="">Unassigned</option>{teamMembers.map((member) => (<option key={member.id} value={member.id}>{member.fullName}</option>))}</select></div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">Save Task</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;