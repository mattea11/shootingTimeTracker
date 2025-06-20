"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface TimeData {
  [userId: string]: {
    [round: number]: {
      time1: { input: string; total?: number; isEditable: boolean }
      time2: { input: string; total?: number; isEditable: boolean }
      time3: { input: string; total?: number; isEditable: boolean }
    }
  }
}

interface UserRanking {
  username: string
  time: number
  displayTime: string
}

export default function ShootingResults() {
  const navigate = useNavigate()

  const password = import.meta.env.VITE_PASSWORD;

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [users, setUsers] = useState<string[]>([])
  const [timeData, setTimeData] = useState<TimeData>({})

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem("shootingUsers")
    const savedTimeData = localStorage.getItem("shootingTimeData")

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }
    if (savedTimeData) {
      setTimeData(JSON.parse(savedTimeData))
    }
  }, [])

  const getTimeTotal = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3") => {
    return timeData[userId]?.[round]?.[timeSlot]?.total
  }

  const getAllValidTimesForRound = (userId: string, round: number): number[] => {
    const times: number[] = []
      ;["time1", "time2", "time3"].forEach((timeSlot) => {
        const time = getTimeTotal(userId, round, timeSlot as "time1" | "time2" | "time3")
        if (time !== undefined && !isNaN(time)) {
          times.push(time)
        }
      })
    return times
  }

  const getSteelShootingRanking = (): UserRanking[] => {
    return users
      .map((user) => {
        let totalValidRounds = 0
        let totalTime = 0

        for (let round = 1; round <= 20; round++) {
          const roundTimes = getAllValidTimesForRound(user, round)
          if (roundTimes.length > 0) {
            totalValidRounds++
            // Sort times and drop the worst (largest) time
            const sortedTimes = [...roundTimes].sort((a, b) => a - b)
            const timesToAverage = sortedTimes.slice(0, -1) // Drop the worst time
            const roundTotal = timesToAverage.reduce((sum, time) => sum + time, 0)
            totalTime += roundTotal / timesToAverage.length
          }
        }

        return {
          username: user,
          time: totalValidRounds > 0 ? totalTime : 0,
          displayTime: totalValidRounds > 0 ? totalTime.toFixed(2) : "N/A",
        }
      })
      .filter((user) => user.time > 0)
      .sort((a, b) => a.time - b.time)
  }

  const getAverageRanking = (): UserRanking[] => {
    return users
      .map((user) => {
        const allTimes: number[] = []
        for (let round = 1; round <= 20; round++) {
          const roundTimes = getAllValidTimesForRound(user, round)
          allTimes.push(...roundTimes)
        }

        const averageTime = allTimes.length > 0 ?
          allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : 0

        return {
          username: user,
          time: averageTime,
          displayTime: allTimes.length > 0 ? averageTime.toFixed(2) : "N/A",
        }
      })
      .filter((user) => user.time > 0)
      .sort((a, b) => a.time - b.time)
  }

  const getBestTimeRanking = (): UserRanking[] => {
    return users
      .map((user) => {
        const allTimes: number[] = []
        for (let round = 1; round <= 20; round++) {
          const roundTimes = getAllValidTimesForRound(user, round)
          allTimes.push(...roundTimes)
        }

        const bestTime = allTimes.length > 0 ? Math.min(...allTimes) : 0

        return {
          username: user,
          time: bestTime,
          displayTime: allTimes.length > 0 ? bestTime.toFixed(2) : "N/A",
        }
      })
      .filter((user) => user.time > 0)
      .sort((a, b) => a.time - b.time)
  }

  const exportToCSV = () => {
    // Get all rankings
    const steelRanking = getSteelShootingRanking();
    const averageRanking = getAverageRanking();
    const bestTimeRanking = getBestTimeRanking();

    // Create CSV content
    let csv = "Shooting Results\n\n";

    // 1. Raw Data Section
    csv += "Raw Time Data\n";
    csv += "User,";
    for (let round = 1; round <= 20; round++) {
      csv += `Round ${round} Time1,Round ${round} Time2,Round ${round} Time3,`;
    }
    csv = csv.slice(0, -1) + "\n";

    users.forEach((user) => {
      csv += `${user},`;
      for (let round = 1; round <= 20; round++) {
        const time1 = getTimeTotal(user, round, "time1") || "";
        const time2 = getTimeTotal(user, round, "time2") || "";
        const time3 = getTimeTotal(user, round, "time3") || "";
        csv += `${time1},${time2},${time3},`;
      }
      csv = csv.slice(0, -1) + "\n";
    });

    // 2. Steel Shooting Ranking
    csv += "\nSteel Shooting Ranking\n";
    csv += "Rank,Username,Total Time\n";
    steelRanking.forEach((user, index) => {
      csv += `${index + 1},${user.username},${user.displayTime}\n`;
    });

    // 3. Average Ranking
    csv += "\nAverage Time Ranking\n";
    csv += "Rank,Username,Average Time\n";
    averageRanking.forEach((user, index) => {
      csv += `${index + 1},${user.username},${user.displayTime}\n`;
    });

    // 4. Best Time Ranking
    csv += "\nBest Time Ranking\n";
    csv += "Rank,Username,Best Time\n";
    bestTimeRanking.forEach((user, index) => {
      csv += `${index + 1},${user.username},${user.displayTime}\n`;
    });

    // Create and download the CSV file
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shooting-results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    localStorage.removeItem("shootingUsers")
    localStorage.removeItem("shootingTimeData")
    localStorage.removeItem("currentRound")

    setUsers([])
    setTimeData({})
    navigate("/") // Optional: redirect back to main page
  }

  const verifyPassword = () => {
    if (passwordInput === password) {
      exportToCSV()
      clearAllData()
      setPasswordDialogOpen(false)
      setPasswordInput("")
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }


  const RankingTable = ({ title, rankings }: { title: string; rankings: UserRanking[] }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium">Username</th>
                <th className="text-right p-3 font-medium">Time (s)</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((user, index) => (
                <tr key={user.username} className="border-b">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">{user.displayTime}</td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )

  const steelRanking = getSteelShootingRanking()
  const averageRanking = getAverageRanking()
  const bestTimeRanking = getBestTimeRanking()

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Shooting Results</h1>
        </div>

        <RankingTable title="Steel Shooting Ranking" rankings={steelRanking} />

        <RankingTable title="Average Time" rankings={averageRanking} />

        <RankingTable title="Best Time" rankings={bestTimeRanking} />

        <div className="mb-4">
          <Button onClick={exportToCSV} className="w-full h-12 text-base" variant="outline">
            <Download className="mr-2 h-5 w-5" />
            Export to CSV
          </Button>
        </div>

        <Button
          onClick={() => setPasswordDialogOpen(true)}
          className="w-full h-12 text-base"
          variant="destructive"
        >
          <Trash2 className="mr-2 h-5 w-5" />
          Clear All Data
        </Button>
      </div>
      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter password to export and clear all data</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all data? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              id="passwordInput"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && verifyPassword()}
            />
            {passwordError && (
              <p className="text-sm text-red-500">Incorrect password</p>
            )}
            <Button onClick={verifyPassword} className="w-full">
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}