'use client'

import { useState, useEffect } from 'react'
import { Calendar, ArrowRight, Clock } from 'lucide-react'
import { GroupHistory } from '@/types'

interface StudentGroupHistoryProps {
  studentId: string
  studentName: string
}

export function StudentGroupHistory({ studentId, studentName }: StudentGroupHistoryProps) {
  const [groupHistory, setGroupHistory] = useState<GroupHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroupHistory()
  }, [studentId])

  const fetchGroupHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/students/${studentId}/group-history`)
      if (response.ok) {
        const data = await response.json()
        setGroupHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch group history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (startDate: Date, endDate?: Date) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffInMs = end.getTime() - start.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 30) {
      return `${diffInDays} days`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} month${months > 1 ? 's' : ''}`
    } else {
      const years = Math.floor(diffInDays / 365)
      const remainingMonths = Math.floor((diffInDays % 365) / 30)
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Group History</h3>
        <div className="text-center py-4">
          <div className="text-gray-600">Loading group history...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Group History for {studentName}
      </h3>

      {groupHistory.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-gray-600">No group history available</div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupHistory.map((history, index) => (
            <div key={history.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {history.group?.name}
                    </h4>
                    {!history.endDate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Started: {new Date(history.startDate).toLocaleDateString()}
                        {history.endDate && (
                          <>
                            <ArrowRight className="h-4 w-4 mx-2 inline" />
                            Ended: {new Date(history.endDate).toLocaleDateString()}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        Duration: {formatDuration(history.startDate, history.endDate)}
                        {!history.endDate && ' (ongoing)'}
                      </span>
                    </div>

                    {history.reason && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {history.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {index === 0 && !history.endDate ? 'Current Group' : 'Previous Group'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {groupHistory.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Total groups: {groupHistory.length}</div>
            <div>
              Member since: {new Date(Math.min(...groupHistory.map(h => new Date(h.startDate).getTime()))).toLocaleDateString()}
            </div>
            {groupHistory.filter(h => !h.endDate).length > 0 ? (
              <div>
                Currently in: {groupHistory.find(h => !h.endDate)?.group?.name}
              </div>
            ) : (
              <div>Not currently assigned to any group</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}