"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TimeData {
  [userId: string]: {
    [round: number]: {
      time1: string
      time2: string
      time3: string
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

  const getTime = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3") => {
    return timeData[userId]?.[round]?.[timeSlot] || ""
  }

  const getAllUserTimes = (userId: string): number[] => {
    const times: number[] = []
    for (let round = 1; round <= 20; round++) {
      ;["time1", "time2", "time3"].forEach((timeSlot) => {
        const time = getTime(userId, round, timeSlot as "time1" | "time2" | "time3")
        if (time && !isNaN(Number.parseFloat(time))) {
          times.push(Number.parseFloat(time))
        }
      })
    }
    return times
  }

  const getSteelShootingRanking = (): UserRanking[] => {
    return users
      .map((user) => {
        const times = getAllUserTimes(user)
        const totalTime = times.reduce((sum, time) => sum + time, 0)
        return {
          username: user,
          time: totalTime,
          displayTime: times.length > 0 ? totalTime.toFixed(2) : "N/A",
        }
      })
      .filter((user) => user.time > 0)
      .sort((a, b) => a.time - b.time)
  }

  const getAverageRanking = (): UserRanking[] => {
    return users
      .map((user) => {
        const times = getAllUserTimes(user)
        const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0
        return {
          username: user,
          time: averageTime,
          displayTime: times.length > 0 ? averageTime.toFixed(2) : "N/A",
        }
      })
      .filter((user) => user.time > 0)
      .sort((a, b) => a.time - b.time)
  }

  const getBestTimeRanking = (): UserRanking[] => {
    return users
      .map((user) => {
        const times = getAllUserTimes(user)
        const bestTime = times.length > 0 ? Math.min(...times) : 0
        return {
          username: user,
          time: bestTime,
          displayTime: times.length > 0 ? bestTime.toFixed(2) : "N/A",
        }
      })
      .filter((user) => user.time > 0)
      .sort((a, b) => a.time - b.time)
  }

  const exportToCSV = () => {
    let csv = "User,"
    for (let round = 1; round <= 20; round++) {
      csv += `Round ${round} Time1,Round ${round} Time2,Round ${round} Time3,`
    }
    csv = csv.slice(0, -1) + "\n"

    users.forEach((user) => {
      csv += `${user},`
      for (let round = 1; round <= 20; round++) {
        const time1 = getTime(user, round, "time1")
        const time2 = getTime(user, round, "time2")
        const time3 = getTime(user, round, "time3")
        csv += `${time1},${time2},${time3},`
      }
      csv = csv.slice(0, -1) + "\n"
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "shooting-times.csv"
    a.click()
    window.URL.revokeObjectURL(url)
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
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Shooting Results</h1>
        </div>

        {/* Steel Shooting Ranking */}
        <RankingTable title="Steel Shooting Ranking" rankings={steelRanking} />

        {/* Average Ranking */}
        <RankingTable title="Average Ranking" rankings={averageRanking} />

        {/* Best Time Ranking */}
        <RankingTable title="Best Time" rankings={bestTimeRanking} />

        {/* Export Button */}
        <Button onClick={exportToCSV} className="w-full h-12 text-base" variant="outline">
          <Download className="mr-2 h-5 w-5" />
          Export to CSV
        </Button>
      </div>
    </div>
  )
}
