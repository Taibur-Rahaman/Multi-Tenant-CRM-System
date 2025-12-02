import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Deals from './pages/Deals';
import Contacts from './pages/Contacts';
import Accounts from './pages/Accounts';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Activities from './pages/Activities';
import Tasks from './pages/Tasks';
import Calls from './pages/Calls';
import Issues from './pages/Issues';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
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
          
          {/* Sales */}
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/products" element={<Products />} />
          <Route path="/quotes" element={<Quotes />} />
          
          {/* Activities */}
          <Route path="/activities" element={<Activities />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calls" element={<Calls />} />
          
          {/* Support */}
          <Route path="/issues" element={<Issues />} />
          
          {/* Insights */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          
          {/* Settings */}
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Legacy routes - redirect to new paths */}
          <Route path="/customers" element={<Navigate to="/contacts" replace />} />
          <Route path="/interactions" element={<Navigate to="/activities" replace />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
