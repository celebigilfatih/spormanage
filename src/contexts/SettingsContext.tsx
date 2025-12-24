'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SystemSettings {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  currency: string
  timeZone: string
  language: string
  emailNotifications: boolean
  smsNotifications: boolean
  autoBackup: boolean
  backupFrequency: string
  sessionTimeout: number
}

interface SettingsContextType {
  settings: SystemSettings
  updateSettings: (newSettings: Partial<SystemSettings>) => void
  loadSettings: () => Promise<void>
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const defaultSettings: SystemSettings = {
  schoolName: 'Futbol Okulu',
  schoolAddress: 'İstanbul, Türkiye',
  schoolPhone: '+90 212 555 0000',
  schoolEmail: 'info@futbolokulu.com',
  currency: 'TRY',
  timeZone: 'Europe/Istanbul',
  language: 'tr',
  emailNotifications: true,
  smsNotifications: false,
  autoBackup: true,
  backupFrequency: 'daily',
  sessionTimeout: 24
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        loadSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
