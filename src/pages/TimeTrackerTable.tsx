"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Plus, Download, BarChart3, Trash2, Edit, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

interface TimeData {
   [userId: string]: {
        [round: number]: {
            time1: { input: string; total?: number; isEditable: boolean }
            time2: { input: string; total?: number; isEditable: boolean }
            time3: { input: string; total?: number; isEditable: boolean }
        }
    }
}

const password = import.meta.env.VITE_PASSWORD;

export default function TimeTrackerTable() {
    const navigate = useNavigate()

    const [currentRound, setCurrentRound] = useState(1)
    const [users, setUsers] = useState<string[]>([])
    const [newUserName, setNewUserName] = useState("")
    const [timeData, setTimeData] = useState<TimeData>({})
    const [activeInput, setActiveInput] = useState<{ userId: string, round: number, timeSlot: "time1" | "time2" | "time3" } | null>(null)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [passwordInput, setPasswordInput] = useState("")
    const [passwordError, setPasswordError] = useState(false)
    const [pendingEdit, setPendingEdit] = useState<{ userId: string, round: number, timeSlot: "time1" | "time2" | "time3" } | null>(null)
    const [verifiedCells, _] = useState<{ [key: string]: boolean}>({})
    const [editingUser, setEditingUser] = useState<string | null>(null)
    const [editUserName, setEditUserName] = useState("")
    const [showUserDialog, setShowUserDialog] = useState(false)

    const addUser = () => {
        if (newUserName.trim()) {
            setUsers([...users, newUserName.trim()])
            setNewUserName("")
        }
    }

    const isValidNumber = (str: string) => {
        return /^(\d+\.?\d*|\.\d+)$/.test(str)
    }

    const handleInputChange = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3", value: string) => {
        const filteredValue = value.replace(/[^0-9.+]/g, '')

        let newValue = filteredValue
            .replace(/\.+/g, '.')
            .replace(/\++/g, '+')
            .replace(/^\+/, '')
            .replace(/\.$/, '')

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
                        total: prev[userId]?.[round]?.[timeSlot]?.total,
                        isEditable: false
                    },
                },
            },
        }))
    }

    const handleInputFocus = (userId: string, round: number, timeSlot: "time1" | "time2" | "time3") => {
        const currentCell = timeData[userId]?.[round]?.[timeSlot] || {
            input: "",
            total: undefined,
            isEditable: true
        };

        if (currentCell.input && !currentCell.isEditable) {
            setPendingEdit({ userId, round, timeSlot })
            setPasswordDialogOpen(true)
        } else {
            setActiveInput({ userId, round, timeSlot })
        }
    }

    const verifyPassword = () => {
        if (passwordInput === password) {
            if (pendingEdit) {
                setTimeData(prev => ({
                    ...prev,
                    [pendingEdit.userId]: {
                        ...prev[pendingEdit.userId] || {},
                        [pendingEdit.round]: {
                            ...prev[pendingEdit.userId]?.[pendingEdit.round] || {},
                            [pendingEdit.timeSlot]: {
                                ...prev[pendingEdit.userId]?.[pendingEdit.round]?.[pendingEdit.timeSlot] || { input: "", total: undefined },
                                isEditable: true
                            }
                        }
                    }
                }));
                
                setActiveInput(pendingEdit)
                setPasswordDialogOpen(false)
                setPasswordInput("")
                setPasswordError(false)
            }
        } else {
            setPasswordError(true)
        }
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
                                total: total,
                                isEditable: false
                            },
                        },
                    },
                }))
            } else {
                setTimeData((prev) => ({
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        [round]: {
                            ...prev[userId]?.[round],
                            [timeSlot]: {
                                input: input,
                                total: undefined,
                                isEditable: false
                            },
                        },
                    },
                }))
            }
        } else {
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
                                total: num,
                                isEditable: false
                            },
                        },
                    },
                }))
            } else {
                setTimeData((prev) => ({
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        [round]: {
                            ...prev[userId]?.[round],
                            [timeSlot]: {
                                input: input,
                                total: undefined,
                                isEditable: false
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

    const handleShowResults = () => {
        // Save data to localStorage
        localStorage.setItem("shootingUsers", JSON.stringify(users))
        localStorage.setItem("shootingTimeData", JSON.stringify(timeData))
        
        // Navigate to results page
        navigate("/shootingResults")
    }

    // User management functions
    const handleUserClick = (username: string) => {
        setEditingUser(username)
        setEditUserName(username)
        setShowUserDialog(true)
    }

    const handleRenameUser = () => {
        if (editingUser && editUserName.trim() && editUserName.trim() !== editingUser) {
            // Update users array
            const updatedUsers = users.map((user) => (user === editingUser ? editUserName.trim() : user))
            setUsers(updatedUsers)

            // Update timeData keys
            const updatedTimeData = { ...timeData }
            if (updatedTimeData[editingUser]) {
                updatedTimeData[editUserName.trim()] = updatedTimeData[editingUser]
                delete updatedTimeData[editingUser]
                setTimeData(updatedTimeData)
            }
        }
        setShowUserDialog(false)
        setEditingUser(null)
        setEditUserName("")
    }

    const handleDeleteUser = () => {
        if (editingUser) {
            // Remove user from users array
            const updatedUsers = users.filter((user) => user !== editingUser)
            setUsers(updatedUsers)

            // Remove user's timeData
            const updatedTimeData = { ...timeData }
            delete updatedTimeData[editingUser]
            setTimeData(updatedTimeData)
        }
        setShowUserDialog(false)
        setEditingUser(null)
        setEditUserName("")
    }

    const closeUserDialog = () => {
        setShowUserDialog(false)
        setEditingUser(null)
        setEditUserName("")
    }

    return (
        <div className="min-h-full pt-4">
            <div className="max-w-md mx-auto">
                {/* Password Dialog */}
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Password Required</DialogTitle>
                            <DialogDescription>
                                Enter password to edit this field
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                type="password"
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

                {/* User Edit Dialog */}
                <Dialog open={showUserDialog} onOpenChange={closeUserDialog}>
                    <DialogContent className="max-w-sm mx-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Shooter</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="editUsername" className="block text-sm font-medium text-gray-700 mb-2">
                                    Shooter Name
                                </label>
                                <Input
                                    id="editUsername"
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    placeholder="Enter shooter name"
                                    className="w-full"
                                    onKeyPress={(e) => e.key === "Enter" && handleRenameUser()}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            
                            <Button variant="outline" onClick={closeUserDialog}>
                                <X className="h-4 w-4" ></X>
                                Cancel
                            </Button><Button variant="destructive" onClick={handleDeleteUser} className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                            
                            <Button onClick={handleRenameUser} disabled={!editUserName.trim()} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
                                            <td className="p-3">
                                                <button
                                                    onClick={() => handleUserClick(user)}
                                                    className="font-medium text-left hover:text-green-600 hover:font-bold transition-colors"
                                                >
                                                    {user}
                                                </button>
                                            </td>
                                            {(["time1", "time2", "time3"] as const).map((timeSlot) => (
                                                <td key={timeSlot} className="p-2">
                                                    <div className="flex flex-col items-center">
                                                        <Input
                                                            type="text"
                                                            placeholder="0.00"
                                                            className="text-center text-sm h-10"
                                                            value={getTimeInput(user, currentRound, timeSlot)}
                                                            onChange={(e) => handleInputChange(user, currentRound, timeSlot, e.target.value)}
                                                            onFocus={() => handleInputFocus(user, currentRound, timeSlot)}
                                                            onBlur={() => {
                                                                calculateTotal(user, currentRound, timeSlot)
                                                                setActiveInput(null)
                                                            }}
                                                            readOnly={!!(getTimeInput(user, currentRound, timeSlot) &&
                                                                (!activeInput ||
                                                                    activeInput.userId !== user ||
                                                                    activeInput.round !== currentRound ||
                                                                    activeInput.timeSlot !== timeSlot) &&
                                                                !verifiedCells[`${user}-${currentRound}-${timeSlot}`])}
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
                        <Button className="w-full h-12 text-base" variant="default" onClick={handleShowResults}>
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