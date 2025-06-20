"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Download, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TimeData {
    [userId: string]: {
        [round: number]: {
            time1: { input: string; total?: number }
            time2: { input: string; total?: number }
            time3: { input: string; total?: number }
        }
    }
}

export default function Component() {
    const [currentRound, setCurrentRound] = useState(1)
    const [users, setUsers] = useState<string[]>([])
    const [newUserName, setNewUserName] = useState("")
    const [timeData, setTimeData] = useState<TimeData>({})
    const [showResults, setShowResults] = useState(false)
    const [activeInput, setActiveInput] = useState<{ userId: string, round: number, timeSlot: "time1" | "time2" | "time3" } | null>(null)

    const addUser = () => {
        if (newUserName.trim()) {
            setUsers([...users, newUserName.trim()])
            setNewUserName("")
        }
    }

    const isValidNumber = (str: string) => {
        // Check if the string is a valid number (including decimals)
        return /^(\d+\.?\d*|\.\d+)$/.test(str)
    }

    const handleInputChange = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3", value: string) => {
        // Only allow numbers, decimal points, and + characters
        const filteredValue = value.replace(/[^0-9.+]/g, '')

        // Prevent consecutive decimal points or + signs
        let newValue = filteredValue
            .replace(/\.+/g, '.') // Replace multiple dots with single dot
            .replace(/\++/g, '+') // Replace multiple + with single +
            .replace(/^\+/, '')    // Remove leading +
            .replace(/\.$/, '')    // Remove trailing dot (temporarily)

        // Re-add trailing dot if it was part of the original input
        if (filteredValue.endsWith('.') && !filteredValue.endsWith('..')) {
            newValue += '.'
        }

        setTimeData((prev) => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [round]: {
                    ...prev[userId]?.[round],
                    [timeSlot]: {
                        input: newValue,
                        total: prev[userId]?.[round]?.[timeSlot]?.total
                    },
                },
            },
        }))
    }

    const calculateTotal = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3") => {
        const input = timeData[userId]?.[round]?.[timeSlot]?.input || ""
        if (input.includes('+')) {
            const numbers = input.split('+').filter(n => n !== '')
            let total = 0
            let allValid = true

            for (const num of numbers) {
                if (!isValidNumber(num)) {
                    allValid = false
                    break
                }
                total += parseFloat(num)
            }

            if (allValid) {
                setTimeData((prev) => ({
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        [round]: {
                            ...prev[userId]?.[round],
                            [timeSlot]: {
                                input: input,
                                total: total
                            },
                        },
                    },
                }))
            } else {
                // If invalid numbers, clear the total
                setTimeData((prev) => ({
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        [round]: {
                            ...prev[userId]?.[round],
                            [timeSlot]: {
                                input: input,
                                total: undefined
                            },
                        },
                    },
                }))
            }
        } else {
            // If no +, just parse the single number
            if (isValidNumber(input)) {
                const num = parseFloat(input)
                setTimeData((prev) => ({
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        [round]: {
                            ...prev[userId]?.[round],
                            [timeSlot]: {
                                input: input,
                                total: num
                            },
                        },
                    },
                }))
            } else {
                // Invalid single number
                setTimeData((prev) => ({
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        [round]: {
                            ...prev[userId]?.[round],
                            [timeSlot]: {
                                input: input,
                                total: undefined
                            },
                        },
                    },
                }))
            }
        }
    }

    const getTimeInput = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3") => {
        return timeData[userId]?.[round]?.[timeSlot]?.input || ""
    }

    const getTimeTotal = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3") => {
        return timeData[userId]?.[round]?.[timeSlot]?.total
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
                const time1 = getTimeTotal(user, round, "time1") || ""
                const time2 = getTimeTotal(user, round, "time2") || ""
                const time3 = getTimeTotal(user, round, "time3") || ""
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

    const calculateUserStats = (userId: string) => {
        let totalTimes = 0
        let timeCount = 0
        let bestTime = Number.POSITIVE_INFINITY

        for (let round = 1; round <= 20; round++) {
            ;["time1", "time2", "time3"].forEach((timeSlot) => {
                const time = getTimeTotal(userId, round, timeSlot as "time1" | "time2" | "time3")
                if (time !== undefined && !isNaN(time)) {
                    totalTimes += time
                    timeCount++
                    if (time < bestTime) {
                        bestTime = time
                    }
                }
            })
        }

        return {
            average: timeCount > 0 ? (totalTimes / timeCount).toFixed(2) : "N/A",
            best: bestTime !== Number.POSITIVE_INFINITY ? bestTime.toFixed(2) : "N/A",
            total: timeCount,
        }
    }

    if (showResults) {
        return (
            <div className="min-h-screen">
                <div className="max-w-md mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">Shooting Results</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {users.map((user) => {
                                const stats = calculateUserStats(user)
                                return (
                                    <div key={user} className="p-4 bg-white rounded-lg border">
                                        <h3 className="font-semibold text-lg mb-2">{user}</h3>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="text-center">
                                                <div className="text-gray-500">Best Time</div>
                                                <div className="font-semibold">{stats.best}s</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-500">Average</div>
                                                <div className="font-semibold">{stats.average}s</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-500">Total Shots</div>
                                                <div className="font-semibold">{stats.total}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <Button onClick={() => setShowResults(false)} className="w-full" variant="outline">
                                Back to Tracker
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-full pt-4">
            <div className="max-w-md mx-auto">
                {/* Header with Round Navigation */}
                <Card className="mb-4">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
                                disabled={currentRound === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <CardTitle className="text-xl">Round {currentRound}</CardTitle>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentRound(Math.min(20, currentRound + 1))}
                                disabled={currentRound === 20}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-center text-sm text-gray-500">{currentRound} of 20 rounds</div>
                    </CardHeader>
                </Card>

                {/* Time Entry Table */}
                <Card className="mb-4">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left p-3 font-medium">Shooter</th>
                                        <th className="text-center p-2 font-medium text-sm">Time 1</th>
                                        <th className="text-center p-2 font-medium text-sm">Time 2</th>
                                        <th className="text-center p-2 font-medium text-sm">Time 3</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user} className="border-b">
                                            <td className="p-3 font-medium">{user}</td>
                                            {(["time1", "time2", "time3"] as const).map((timeSlot) => (
                                                <td key={timeSlot} className="p-2">
                                                    <div className="flex flex-col items-center">
                                                        <Input
                                                            type="text"
                                                            placeholder="0.00"
                                                            className="text-center text-sm h-10"
                                                            value={getTimeInput(user, currentRound, timeSlot)}
                                                            onChange={(e) => handleInputChange(user, currentRound, timeSlot, e.target.value)}
                                                            onFocus={() => setActiveInput({ userId: user, round: currentRound, timeSlot })}
                                                            onBlur={() => {
                                                                calculateTotal(user, currentRound, timeSlot)
                                                                setActiveInput(null)
                                                            }}
                                                        />
                                                        {activeInput?.userId !== user ||
                                                            activeInput?.round !== currentRound ||
                                                            activeInput?.timeSlot !== timeSlot ? (
                                                            <div className="font-bold text-sm mt-1">
                                                                {getTimeTotal(user, currentRound, timeSlot) || ""}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="border-b bg-gray-50">
                                        <td colSpan={4} className="p-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    className="w-full text-sm"
                                                    placeholder="New shooter name"
                                                    value={newUserName}
                                                    onChange={(e) => setNewUserName(e.target.value)}
                                                    onKeyPress={(e) => e.key === "Enter" && addUser()}
                                                />
                                                <Button size="sm" onClick={addUser} disabled={!newUserName.trim()}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {users.length > 0 && (
                        <Button onClick={() => setShowResults(true)} className="w-full h-12 text-base" variant="default">
                            <BarChart3 className="mr-2 h-5 w-5" />
                            Show Results
                        </Button>
                    )}

                    {users.length > 0 && (
                        <Button onClick={exportToCSV} className="w-full h-12 text-base" variant="outline">
                            <Download className="mr-2 h-5 w-5" />
                            Export to CSV
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}