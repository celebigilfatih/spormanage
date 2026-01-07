'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Student } from '@/types'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'

interface StudentPrintFormProps {
  student: Student
  onClose: () => void
}

export function StudentPrintForm({ student, onClose }: StudentPrintFormProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.schoolLogo) {
            setSchoolLogo(data.schoolLogo)
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handlePrint = () => {
    if (loading) {
      alert('Logo yükleniyor, lütfen bekleyin...');
      return;
    }
    
    const printWindow = window.open('', '', 'height=800,width=600')
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${student.firstName} ${student.lastName}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                line-height: 1.6;
              }
              
              @page {
                size: A4 portrait;
                margin: 1cm;
              }
              
              .page {
                width: 210mm;
                height: 297mm;
                margin: 0 auto;
                padding: 20px;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              
              .header {
                text-align: center;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 15px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
              }
              
              .header-logo {
                width: 60px;
                height: 60px;
                object-fit: contain;
              }
              
              .header-content {
                flex: 1;
              }
              
              .header h1 {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 5px;
              }
              
              .header p {
                font-size: 12px;
                color: #666;
              }
              
              .section {
                margin-bottom: 20px;
              }
              
              .section-title {
                font-size: 14px;
                font-weight: bold;
                background-color: #f3f4f6;
                padding: 8px 12px;
                border-left: 4px solid #1e40af;
                margin-bottom: 12px;
                color: #1f2937;
              }
              
              .info-row {
                display: flex;
                margin-bottom: 10px;
                font-size: 12px;
              }
              
              .info-label {
                font-weight: 600;
                width: 140px;
                color: #4b5563;
                flex-shrink: 0;
              }
              
              .info-value {
                color: #333;
                flex: 1;
              }
              
              .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
              }
              
              .badge-active {
                background-color: #dcfce7;
                color: #166534;
              }
              
              .badge-inactive {
                background-color: #fee2e2;
                color: #991b1b;
              }
              
              .badge-primary {
                background-color: #dbeafe;
                color: #1e40af;
              }
              
              .badge-emergency {
                background-color: #fee2e2;
                color: #991b1b;
              }
              
              .parent-card {
                border: 1px solid #e5e7eb;
                padding: 12px;
                margin-bottom: 10px;
                border-radius: 4px;
                background-color: #f9fafb;
              }
              
              .parent-name {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 12px;
              }
              
              .badges-group {
                display: flex;
                gap: 6px;
                margin-bottom: 8px;
              }
              
              .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                font-size: 10px;
                color: #666;
                text-align: center;
              }
              
              @media print {
                body {
                  background: white;
                }
                .page {
                  box-shadow: none;
                  margin: 0;
                  padding: 1cm;
                  width: 100%;
                  height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="header">
                ${schoolLogo ? `<img src="${schoolLogo}" alt="Logo" class="header-logo" />` : ''}
                <div class="header-content">
                  <h1>Öğrenci Bilgi Formu</h1>
                  <p>Futbol Okulu - Öğrenci Kayıt Sistemi</p>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Öğrenci Bilgileri</div>
                <div class="info-row">
                  <div class="info-label">Ad Soyad:</div>
                  <div class="info-value"><strong>${student.firstName} ${student.lastName}</strong></div>
                </div>
                ${student.phone ? `
                <div class="info-row">
                  <div class="info-label">Telefon:</div>
                  <div class="info-value">${student.phone}</div>
                </div>
                ` : ''}
                ${student.birthDate ? `
                <div class="info-row">
                  <div class="info-label">Doğum Tarihi:</div>
                  <div class="info-value">${new Date(student.birthDate).toLocaleDateString('tr-TR')}</div>
                </div>
                ` : ''}
                <div class="info-row">
                  <div class="info-label">Kayıt Tarihi:</div>
                  <div class="info-value">${new Date(student.enrollmentDate).toLocaleDateString('tr-TR')}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Durum:</div>
                  <div class="info-value">
                    <span class="badge ${student.isActive ? 'badge-active' : 'badge-inactive'}">
                      ${student.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
                ${student.group ? `
                <div class="info-row">
                  <div class="info-label">Grup:</div>
                  <div class="info-value">
                    <span class="badge badge-primary">${student.group.name}</span>
                  </div>
                </div>
                ` : ''}
                ${student.branch ? `
                <div class="info-row">
                  <div class="info-label">Şube:</div>
                  <div class="info-value">${student.branch.name}</div>
                </div>
                ` : ''}
              </div>
              
              ${student.parents && student.parents.length > 0 ? `
              <div class="section">
                <div class="section-title">Veli/Vasi Bilgileri</div>
                ${student.parents.map((parent, index) => `
                <div class="parent-card">
                  <div class="parent-name">${parent.firstName} ${parent.lastName}</div>
                  <div class="badges-group">
                    ${parent.isPrimary ? '<span class="badge badge-primary">Ana İletişim</span>' : ''}
                    ${parent.isEmergency ? '<span class="badge badge-emergency">Acil Durum</span>' : ''}
                  </div>
                  <div class="info-row">
                    <div class="info-label">Yakınlık:</div>
                    <div class="info-value">${parent.relationship}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Telefon:</div>
                    <div class="info-value">${parent.phone}</div>
                  </div>
                  ${parent.email ? `
                  <div class="info-row">
                    <div class="info-label">E-posta:</div>
                    <div class="info-value">${parent.email}</div>
                  </div>
                  ` : ''}
                  ${parent.address ? `
                  <div class="info-row">
                    <div class="info-label">Adres:</div>
                    <div class="info-value">${parent.address}</div>
                  </div>
                  ` : ''}
                </div>
                `).join('')}
              </div>
              ` : ''}
              
              <div class="footer">
                <p>Yazdırma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName} - Yazdırma Formu
            </h2>
            <p className="text-gray-600 text-sm mt-1">A4 sayfasına dikey olarak yazdırılacak</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={loading ? "Logo yükleniyor..." : "Yazdır"}
            >
              <Printer className="h-4 w-4" />
              {loading ? 'Yükleniyor...' : 'Yazdır'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
              Kapat
            </button>
          </div>
        </div>

        {/* Preview */}
        <div ref={printRef} className="p-8 bg-gray-50">
          <div className="bg-white p-8 max-w-2xl mx-auto shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 border-b-2 border-blue-600 pb-4 mb-6">
              {schoolLogo && (
                <img
                  src={schoolLogo}
                  alt="Okul Logosu"
                  className="h-16 w-16 object-contain"
                />
              )}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-blue-600 mb-1">Öğrenci Bilgi Formu</h1>
                <p className="text-xs text-gray-600">Futbol Okulu - Öğrenci Kayıt Sistemi</p>
              </div>
            </div>

            {/* Student Info */}
            <div className="mb-6">
              <h3 className="text-sm font-bold bg-gray-100 px-3 py-2 border-l-4 border-blue-600 mb-3 text-gray-900">
                Öğrenci Bilgileri
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-32">Ad Soyad:</span>
                  <span className="text-gray-900 font-medium">
                    {student.firstName} {student.lastName}
                  </span>
                </div>
                {student.phone && (
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Telefon:</span>
                    <span className="text-gray-900">{student.phone}</span>
                  </div>
                )}
                {student.birthDate && (
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Doğum Tarihi:</span>
                    <span className="text-gray-900">
                      {new Date(student.birthDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-32">Kayıt Tarihi:</span>
                  <span className="text-gray-900">
                    {new Date(student.enrollmentDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-32">Durum:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    student.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                {student.group && (
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Grup:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {student.group.name}
                    </span>
                  </div>
                )}
                {student.branch && (
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Şube:</span>
                    <span className="text-gray-900">{student.branch.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Parent Info */}
            {student.parents && student.parents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold bg-gray-100 px-3 py-2 border-l-4 border-blue-600 mb-3 text-gray-900">
                  Veli/Vasi Bilgileri
                </h3>
                <div className="space-y-3">
                  {student.parents.map((parent, index) => (
                    <div key={index} className="border border-gray-200 p-3 bg-gray-50 text-sm">
                      <div className="font-semibold text-gray-900 mb-2">
                        {parent.firstName} {parent.lastName}
                        {parent.isPrimary && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            Ana İletişim
                          </span>
                        )}
                        {parent.isEmergency && (
                          <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                            Acil Durum
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="font-semibold text-gray-600 w-24">Yakınlık:</span>
                          <span className="text-gray-900">{parent.relationship}</span>
                        </div>
                        <div className="flex">
                          <span className="font-semibold text-gray-600 w-24">Telefon:</span>
                          <span className="text-gray-900">{parent.phone}</span>
                        </div>
                        {parent.email && (
                          <div className="flex">
                            <span className="font-semibold text-gray-600 w-24">E-posta:</span>
                            <span className="text-gray-900 break-all">{parent.email}</span>
                          </div>
                        )}
                        {parent.address && (
                          <div className="flex">
                            <span className="font-semibold text-gray-600 w-24">Adres:</span>
                            <span className="text-gray-900">{parent.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
              <p>Yazdırma Tarihi: {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
