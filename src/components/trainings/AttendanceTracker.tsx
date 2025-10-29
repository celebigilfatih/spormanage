'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle,
  Save,
  Calendar,
  MapPin
} from 'lucide-react'
import { Training, TrainingSession, Student, AttendanceStatus, Attendance } from '@/types'

interface AttendanceData {
  studentId: string
  sessionId: string
  status: AttendanceStatus
  notes?: string
  excuseReason?: string
}

interface AttendanceTrackerProps {
  session: TrainingSession & { training: Training }
  onSubmit: (attendances: AttendanceData[]) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function AttendanceTracker({ 
  session, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: AttendanceTrackerProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [attendances, setAttendances] = useState<AttendanceData[]>([])
  const [existingAttendances, setExistingAttendances] = useState<Attendance[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    fetchStudents()
    fetchExistingAttendances()
  }, [session.id])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const response = await fetch(`/api/students?groupId=${session.training.groupId}&status=active&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
        
        // Initialize attendance data
        const initialAttendances = data.students.map((student: Student) => ({
          studentId: student.id,
          sessionId: session.id,
          status: AttendanceStatus.PRESENT,
          notes: '',
          excuseReason: ''
        }))
        setAttendances(initialAttendances)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchExistingAttendances = async () => {
    try {
      const response = await fetch(`/api/attendances?sessionId=${session.id}`)
      if (response.ok) {
        const data = await response.json()
        setExistingAttendances(data)
        
        // Update attendance state with existing data
        if (data.length > 0) {
          setAttendances(prevAttendances =>
            prevAttendances.map(att => {
              const existing = data.find((ex: Attendance) => ex.studentId === att.studentId)
              if (existing) {
                return {
                  studentId: att.studentId,
                  sessionId: session.id,
                  status: existing.status,
                  notes: existing.notes || '',
                  excuseReason: existing.excuseReason || ''
                }
              }
              return att
            })
          )
        }
      }
    } catch (error) {
      console.error('Failed to fetch existing attendances:', error)
    }
  }

  const updateAttendance = (studentId: string, field: keyof AttendanceData, value: any) => {
    setAttendances(prev =>
      prev.map(att =>
        att.studentId === studentId
          ? { ...att, [field]: value }
          : att
      )
    )
  }

  const setAllAttendance = (status: AttendanceStatus) => {
    setAttendances(prev =>
      prev.map(att => ({ ...att, status }))
    )
  }

  const getAttendanceStats = () => {
    const present = attendances.filter(att => att.status === AttendanceStatus.PRESENT).length
    const absent = attendances.filter(att => att.status === AttendanceStatus.ABSENT).length
    const excused = attendances.filter(att => att.status === AttendanceStatus.EXCUSED).length
    const late = attendances.filter(att => att.status === AttendanceStatus.LATE).length
    const total = attendances.length

    return { present, absent, excused, late, total }
  }

  const getStatusColor = (status: AttendanceStatus) => {
    const colors = {
      [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
      [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
      [AttendanceStatus.EXCUSED]: 'bg-yellow-100 text-yellow-800',
      [AttendanceStatus.LATE]: 'bg-orange-100 text-orange-800',
    }
    return colors[status]
  }

  const getStatusLabel = (status: AttendanceStatus) => {
    const labels = {
      [AttendanceStatus.PRESENT]: 'Katıldı',
      [AttendanceStatus.ABSENT]: 'Katılmadı',
      [AttendanceStatus.EXCUSED]: 'Mazeretli',
      [AttendanceStatus.LATE]: 'Geç Kaldı',
    }
    return labels[status]
  }

  const stats = getAttendanceStats()
  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Yoklama Takibi</h2>
      </div>

      {/* Session Details */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">{session.training.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(session.date).toLocaleDateString('tr-TR')} at {new Date(session.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Grup: {session.training.group?.name}
          </div>
          {session.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {session.location}
            </div>
          )}
        </div>
        {session.training.description && (
          <p className="text-sm text-blue-700 mt-2">{session.training.description}</p>
        )}
        {session.notes && (
          <p className="text-sm text-blue-700 mt-1"><strong>Seans Notları:</strong> {session.notes}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAllAttendance(AttendanceStatus.PRESENT)}
          className="text-green-600 hover:text-green-700"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Hepsini Katıldı İşaretle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAllAttendance(AttendanceStatus.ABSENT)}
          className="text-red-600 hover:text-red-700"
        >
          <UserX className="h-4 w-4 mr-2" />
          Hepsini Katılmadı İşaretle
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-green-700">Katıldı</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-red-700">Katılmadı</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.excused}</div>
          <div className="text-sm text-yellow-700">Mazeretli</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.late}</div>
          <div className="text-sm text-orange-700">Geç Kaldı</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
          <div className="text-sm text-blue-700">Oran</div>
        </div>
      </div>

      {/* Student List */}
      {loadingStudents ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Öğrenciler yükleniyor...</div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600">Bu grupta öğrenci bulunamadı</div>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {students.map((student) => {
            const attendance = attendances.find(att => att.studentId === student.id)
            if (!attendance) return null

            return (
              <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  {/* Student Info */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </h4>
                    {student.phone && (
                      <p className="text-sm text-gray-600">{student.phone}</p>
                    )}
                  </div>

                  {/* Status Selection */}
                  <div>
                    <Label className="text-xs text-gray-600">Durum</Label>
                    <Select
                      value={attendance.status}
                      onValueChange={(value) => updateAttendance(student.id, 'status', value as AttendanceStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AttendanceStatus.PRESENT}>
                          <span className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                            Katıldı
                          </span>
                        </SelectItem>
                        <SelectItem value={AttendanceStatus.ABSENT}>
                          <span className="flex items-center">
                            <UserX className="h-4 w-4 mr-2 text-red-600" />
                            Katılmadı
                          </span>
                        </SelectItem>
                        <SelectItem value={AttendanceStatus.EXCUSED}>
                          <span className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                            Mazeretli
                          </span>
                        </SelectItem>
                        <SelectItem value={AttendanceStatus.LATE}>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-orange-600" />
                            Geç Kaldı
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Excuse Reason (if excused) */}
                  {attendance.status === AttendanceStatus.EXCUSED && (
                    <div>
                      <Label className="text-xs text-gray-600">Mazeret Nedeni</Label>
                      <Input
                        placeholder="Mazeret nedeni"
                        value={attendance.excuseReason || ''}
                        onChange={(e) => updateAttendance(student.id, 'excuseReason', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className={attendance.status === AttendanceStatus.EXCUSED ? "md:col-span-2" : "md:col-span-3"}>
                    <Label className="text-xs text-gray-600">Notlar</Label>
                    <Input
                      placeholder="Ek notlar"
                      value={attendance.notes || ''}
                      onChange={(e) => updateAttendance(student.id, 'notes', e.target.value)}
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
                      {getStatusLabel(attendance.status)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button
          onClick={() => onSubmit(attendances)}
          disabled={isLoading || students.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
        </Button>
      </div>
    </div>
  )
}