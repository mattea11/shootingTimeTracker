import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TimeTrackerPage from './pages/TimeTrackerTable.tsx'
import ResultsPage from './pages/ShootingResults.tsx'
import { Target } from 'lucide-react'

function App() {
  return (
    <Router>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Target className="w-8 h-8 text-green-700" />
        </div>
        <span className="text-3xl font-bold mb-8 block">Shooting Time Tracker</span>
        <Routes>
          <Route path="/" element={<TimeTrackerPage />} />
          <Route path="/shootingResults" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App