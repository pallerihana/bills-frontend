import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import CreateProject from '../pages/CreateProject.jsx';
import ProjectDetails from '../pages/ProjectDetails.jsx';
import EmployeeForm from '../pages/EmployeeForm.jsx';
import SharedFormGate from '../pages/SharedFormGate.jsx';

const Protected = () => localStorage.getItem('token')
  ? <><Navbar /><div className="container py-4"><Outlet /></div></>
  : <Navigate to="/login" replace />;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/expense-form/shared/:shareToken" element={<SharedFormGate />} />
      <Route path="/expense-form/:token" element={<EmployeeForm />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
