import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashbaord from './pages/Dashboard';
import Projects from './pages/Project';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Subscription from './pages/Subscription';
import Tenants from './pages/Tenants';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Settings from './pages/Settings';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashbaord />} />
<Route path="/Projects" element={<Projects />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="users" element={<Users />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="profile" element={<Profile />} />
<Route path="settings" element={<Settings />} />
<Route path="tasks" element={<Tasks />} />

      </Routes>
    </Router>
  );
}

export default App;