import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Issues from './pages/Issues'
import Contacts from './pages/Contacts'
import Calls from './pages/Calls'
import Settings from './pages/Settings'

export default function App(){
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-4 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}
