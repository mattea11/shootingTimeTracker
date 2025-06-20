import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Label } from '@radix-ui/react-label'
import TimeTrackerPage from './pages/TimeTrackerTable.tsx'
import ResultsPage from './pages/ShootingResults.tsx'

function App() {
  return (
    <Router>
      <div className="container mx-auto px-4 py-8">
        <Label className="text-3xl font-bold mb-8 block">Shooting Time Tracker</Label>
        <Routes>
          <Route path="/" element={<TimeTrackerPage />} />
          <Route path="/shootingResults" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App