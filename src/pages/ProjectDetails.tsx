import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api'; 
import { 
  ArrowLeft, 
  Calendar, 
  CheckSquare, 
  Edit, 
  Users, 
  BarChart3,
  Trash2,
  Plus,
  X,
  Save,
  Clock,
  Loader
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local UI State
  const [taskFilter, setTaskFilter] = useState({ status: 'all', assignee: 'all' });
  const [editingTask, setEditingTask] = useState(null); 

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Forms
  const [editFormData, setEditFormData] = useState({ name: '', description: '', status: '' });
  const [taskFormData, setTaskFormData] = useState({ 
    title: '', 
    description: '', 
    assignedTo: '', 
    status: 'todo', 
    priority: 'medium', 
    dueDate: '' 
  });

  // --- 1. FETCH DATA ---
  const fetchTasks = async () => {
    try {
        const tasksRes = await api.get(`/projects/${id}/tasks`);
        setTasks(tasksRes.data.data.tasks);
    } catch (err) {
        console.error("Failed to refresh tasks");
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // A. Get Current User info
        const userRes = await api.get('/auth/me');
        const user = userRes.data.data;
        setCurrentUser(user);

        // B. Get Project Details
        const projectsRes = await api.get('/projects?limit=100');
        const foundProject = projectsRes.data.data.projects.find(p => p.id === id);
        
        if (!foundProject) {
            setError("Project not found");
            setLoading(false);
            return;
        }
        setProject(foundProject);
        
        setEditFormData({
            name: foundProject.name,
            description: foundProject.description,
            status: foundProject.status
        });

        // C. Get Project Tasks
        await fetchTasks();

        // D. Get Team Members (for dropdowns)
        const tenantId = user.tenantId || user.tenant_id || (user.tenant && user.tenant.id);
        if (tenantId) {
            const usersRes = await api.get(`/tenants/${tenantId}/users`);
            setTeamMembers(usersRes.data.data.users);
        }

      } catch (err) {
        console.error("Error fetching details:", err);
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
        } else {
            setError("Failed to load project details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id, navigate]);

  // --- 2. HELPERS ---
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const filteredTasks = tasks.filter(task => {
    const matchStatus = taskFilter.status === 'all' || task.status === taskFilter.status;
    const matchAssignee = taskFilter.assignee === 'all' || (task.assignedTo && task.assignedTo.id === taskFilter.assignee);
    return matchStatus && matchAssignee;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // --- 3. HANDLERS ---
  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure? This will delete the project and ALL its tasks.')) {
      try {
        await api.delete(`/projects/${id}`);
        navigate('/projects');
      } catch (err) {
        alert("Failed to delete project.");
      }
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${id}`, editFormData);
      setProject({ ...project, ...res.data.data });
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update project.");
    }
  };

  const openTaskModal = (taskToEdit = null) => {
    if (taskToEdit) {
        setEditingTask(taskToEdit);
        setTaskFormData({
            title: taskToEdit.title,
            description: taskToEdit.description || '', 
            assignedTo: taskToEdit.assignedTo ? taskToEdit.assignedTo.id : '',
            status: taskToEdit.status,
            priority: taskToEdit.priority,
            dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : ''
        });
    } else {
        setEditingTask(null);
        setTaskFormData({ 
            title: '', description: '', assignedTo: '', 
            status: 'todo', priority: 'medium', dueDate: '' 
        });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
          title: taskFormData.title,
          description: taskFormData.description,
          status: taskFormData.status,
          priority: taskFormData.priority,
          dueDate: taskFormData.dueDate || null,
          assignedTo: taskFormData.assignedTo || null
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
      }
      
      await fetchTasks();
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      alert("Failed to save task.");
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    let newStatus = 'todo';
    if (currentStatus === 'todo') newStatus = 'in_progress';
    else if (currentStatus === 'in_progress') newStatus = 'completed';

    try {
        await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
        console.error("Status update failed", err);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Loader className="animate-spin h-12 w-12 text-indigo-600" />
    </div>
  );
  
  if (error || !project) return <div className="p-8 text-center text-red-500">{error || "Project not found"}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        
        <button onClick={() => navigate('/projects')} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
        </button>

        {/* PROJECT HEADER CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-500 max-w-2xl">{project.description || 'No description provided.'}</p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </button>
              <button onClick={handleDeleteProject} className="flex items-center px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Creator</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{project.creatorName || 'Admin'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Created On</p>
              <div className="mt-1 flex items-center text-sm font-medium text-gray-900">
                <Calendar className="w-4 h-4 mr-1 text-gray-400" /> 
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="col-span-2">
               <p className="text-xs font-medium text-gray-500 uppercase">Progress</p>
               <div className="mt-2 flex items-center">
                 <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }}></div>
                 </div>
                 <span className="text-sm font-medium">{progress}%</span>
               </div>
            </div>
          </div>
        </div>

        {/* TASKS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-indigo-600"/> Tasks
                </h3>
                
                <div className="flex items-center gap-2">
                    <select 
                        className="text-xs border-gray-300 rounded-lg py-1.5 px-2 bg-gray-50"
                        value={taskFilter.status}
                        onChange={(e) => setTaskFilter({...taskFilter, status: e.target.value})}
                    >
                        <option value="all">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    <button 
                        onClick={() => openTaskModal()}
                        className="text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center"
                    >
                        <Plus className="w-3 h-3 mr-1" /> New Task
                    </button>
                </div>
              </div>

              {/* TASK LIST */}
              <div className="divide-y divide-gray-100">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleStatusChange(task.id, task.status)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                            ${task.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-indigo-400'}`}
                        >
                          {task.status === 'completed' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                        </button>
                        
                        <div className="flex flex-col">
                            <span className={`${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'} text-sm font-medium`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize 
                                    ${task.priority === 'high' ? 'bg-red-50 text-red-700' : task.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {task.priority}
                                </span>

                                {/* ASSIGNED USER BADGE */}
                                <div className="flex items-center text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                  <Users className="w-3 h-3 mr-1 text-gray-400" />
                                  {task.assignedTo ? (
                                    <span className="font-semibold text-gray-700">{task.assignedTo.fullName}</span>
                                  ) : (
                                    <span className="italic text-gray-400">Unassigned</span>
                                  )}
                                </div>

                                {task.dueDate && (
                                  <span className="text-[10px] text-gray-400 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" /> {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                            </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => openTaskModal(task)} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                          title="Edit Task"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center text-gray-500 text-sm">
                    <CheckSquare className="w-8 h-8 text-gray-300 mb-2"/>
                    No tasks found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR STATS */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600"/> Project Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tasks Completed</span>
                  <span className="font-medium">{completedCount} / {tasks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pending Tasks</span>
                  <span className="font-medium text-orange-600">{tasks.length - completedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: EDIT PROJECT */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-900">Edit Project Details</h3>
                <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
              </div>
              <form onSubmit={handleUpdateProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE / EDIT TASK */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-900">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
                <button onClick={() => setIsTaskModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
              </div>
              <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={taskFormData.title} onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={taskFormData.description} onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter task details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select value={taskFormData.priority} onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input type="date" value={taskFormData.dueDate} onChange={(e) => setTaskFormData({...taskFormData, dueDate: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select value={taskFormData.assignedTo} onChange={(e) => setTaskFormData({...taskFormData, assignedTo: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center">
                    <Save className="w-4 h-4 mr-2"/> {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ProjectDetails;