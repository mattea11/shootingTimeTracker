import './App.css'
import Component from "./components/TimeTrackerTable.tsx"
import { Label } from '@radix-ui/react-label'

function App() {
  return (
    <>
      <Label className="text-4xl font-bold">Shooting Time Tracker</Label>
      <Component />

    </>
  )
}

export default App
