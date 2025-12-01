import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Accounts from './pages/Accounts';
import Interactions from './pages/Interactions';
import Tasks from './pages/Tasks';
import Calls from './pages/Calls';
import Settings from './pages/Settings';
import AIAssistant from './pages/AIAssistant';
import Integrations from './pages/Integrations';
import Issues from './pages/Issues';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/interactions" element={<Interactions />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
