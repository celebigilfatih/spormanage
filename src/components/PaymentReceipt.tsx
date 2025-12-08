'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Payment } from '@/types'
import { Button } from '@/components/ui/button'
import { Printer, X, CheckCircle } from 'lucide-react'

interface PaymentReceiptProps {
  payment: Payment
  paidAmount: number
  paymentMethod: string
  paidDate: string
  onClose: () => void
}

interface Settings {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
}

export function PaymentReceipt({ 
  payment, 
  paidAmount, 
  paymentMethod, 
  paidDate,
  onClose 
}: PaymentReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [settings, setSettings] = useState<Settings>({
    schoolName: 'Futbol Okulu',
    schoolAddress: 'İstanbul, Türkiye',
    schoolPhone: '+90 212 555 0000',
    schoolEmail: 'info@futbolokulu.com'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.log('Could not fetch settings, using defaults')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      'CASH': 'Nakit',
      'CREDIT_CARD': 'Kredi Kartı',
      'BANK_TRANSFER': 'Banka Transferi',
      'CHEQUE': 'Çek'
    }
    return methods[method] || method
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tahsilat Makbuzu - ${payment.student?.firstName} ${payment.student?.lastName}</title>
            <style>
              @media print {
                @page { 
                  margin: 10mm;
                  size: A4 landscape;
                }
                body { margin: 0; }
                .no-print { display: none !important; }
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.4;
                color: #1a1a1a;
                margin: 0;
                padding: 0;
                background: #fff;
              }
              .receipt-container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 12px 18px;
                border: 2px solid #e5e7eb;
                background: #ffffff;
              }
              .company-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 2px solid #1e40af;
              }
              .company-logo {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
              }
              .logo-placeholder {
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                flex-shrink: 0;
              }
              .company-name {
                font-size: 20px;
                font-weight: 700;
                color: #1e40af;
                margin: 0;
                letter-spacing: -0.5px;
              }
              .company-details {
                font-size: 10px;
                color: #6b7280;
                line-height: 1.4;
                text-align: right;
                max-width: 350px;
              }
              .receipt-title {
                text-align: center;
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 6px;
                margin: 8px -18px;
                font-size: 18px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
              }
              .receipt-meta {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 8px;
                background: #f9fafb;
                border-radius: 4px;
              }
              .receipt-number {
                font-size: 12px;
                color: #374151;
              }
              .receipt-number strong {
                color: #1e40af;
                font-size: 14px;
              }
              .receipt-date {
                font-size: 12px;
                color: #374151;
              }
              .two-column-layout {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 8px;
              }
              .info-section {
                margin-bottom: 0;
              }
              .info-section h3 {
                color: #1e40af;
                margin: 0 0 6px 0;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 4px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 3px 6px;
                border-bottom: 1px solid #f3f4f6;
                font-size: 11px;
              }
              .info-row:nth-child(even) {
                background-color: #f9fafb;
              }
              .info-label {
                font-weight: 600;
                color: #374151;
              }
              .info-value {
                color: #1f2937;
              }
              .amount-section {
                background: linear-gradient(to bottom, #eff6ff 0%, #dbeafe 100%);
                border: 2px solid #1e40af;
                border-radius: 4px;
                padding: 10px;
                margin: 10px 0;
                box-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
              }
              .amount-section-title {
                text-align: center;
                color: #1e40af;
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .amount-row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 12px;
              }
              .amount-row.total {
                border-top: 2px solid #1e40af;
                padding-top: 6px;
                margin-top: 6px;
                font-size: 15px;
                font-weight: bold;
                color: #1e40af;
                background: white;
                padding: 8px;
                border-radius: 4px;
                margin-left: -3px;
                margin-right: -3px;
              }
              .paid-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: #10b981;
                color: white;
                padding: 4px 10px;
                border-radius: 15px;
                font-size: 11px;
                font-weight: 600;
                margin-left: 8px;
              }
              .declaration {
                background: #f9fafb;
                border-left: 3px solid #1e40af;
                padding: 6px 10px;
                margin: 8px 0;
                font-size: 10px;
                color: #374151;
                font-style: italic;
              }
              .footer {
                margin-top: 10px;
                padding-top: 8px;
                border-top: 2px solid #e5e7eb;
              }
              .signatures {
                display: flex;
                justify-content: space-around;
                margin-top: 15px;
                gap: 20px;
              }
              .signature-box {
                text-align: center;
                flex: 1;
              }
              .signature-line {
                border-top: 2px solid #1a1a1a;
                margin-top: 30px;
                padding-top: 5px;
                font-size: 11px;
                font-weight: 600;
                color: #374151;
              }
              .signature-label {
                font-size: 9px;
                color: #6b7280;
                margin-top: 2px;
              }
              .print-info {
                text-align: center;
                padding-top: 8px;
                margin-top: 8px;
                border-top: 1px dashed #d1d5db;
              }
              .print-date {
                color: #6b7280;
                font-size: 9px;
              }
              .authenticity-note {
                font-size: 8px;
                color: #9ca3af;
                margin-top: 3px;
                line-height: 1.3;
              }
              .qr-placeholder {
                width: 50px;
                height: 50px;
                border: 2px dashed #d1d5db;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 6px auto;
                font-size: 8px;
                color: #9ca3af;
                border-radius: 3px;
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const receiptNumber = `MAK-${new Date().getFullYear()}-${payment.id.substring(0, 8).toUpperCase()}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Tahsilat Makbuzu</h2>
          <div className="flex space-x-2">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Yazdır
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Kapat
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={printRef} className="p-8">
          <div className="receipt-container">
            {/* Company Header */}
            <div className="company-header">
              <div className="company-logo">
                <div className="logo-placeholder">
                  {settings.schoolName.substring(0, 2).toUpperCase()}
                </div>
                <h1 className="company-name">{settings.schoolName}</h1>
              </div>
              <div className="company-details">
                {settings.schoolAddress} | Tel: {settings.schoolPhone} | {settings.schoolEmail}
              </div>
            </div>

            {/* Receipt Title */}
            <div className="receipt-title">
              TAHSİLAT MAKBUZU
            </div>

            {/* Receipt Meta Information */}
            <div className="receipt-meta">
              <div className="receipt-number">
                <div>Makbuz No:</div>
                <strong>{receiptNumber}</strong>
              </div>
              <div className="receipt-date">
                <div>Düzenleme Tarihi:</div>
                <strong>{formatDate(new Date().toString())}</strong>
              </div>
            </div>

            {/* Two Column Layout for Student and Payment Info */}
            <div className="two-column-layout">
              {/* Student Information */}
              <div className="info-section">
                <h3>Öğrenci Bilgileri</h3>
                <div className="info-row">
                  <span className="info-label">Öğrenci Adı Soyadı:</span>
                  <span className="info-value">{payment.student?.firstName} {payment.student?.lastName}</span>
                </div>
                {payment.student?.group && (
                  <div className="info-row">
                    <span className="info-label">Grup:</span>
                    <span className="info-value">{payment.student.group.name}</span>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="info-section">
                <h3>Ödeme Bilgileri</h3>
                <div className="info-row">
                  <span className="info-label">Ücret Tipi:</span>
                  <span className="info-value">{payment.feeType?.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ödeme Yöntemi:</span>
                  <span className="info-value">{getPaymentMethodText(paymentMethod)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ödeme Tarihi:</span>
                  <span className="info-value">{formatDate(paidDate)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Vade Tarihi:</span>
                  <span className="info-value">{formatDate(payment.dueDate.toString())}</span>
                </div>
              </div>
            </div>

            {/* Amount Details */}
            <div className="amount-section">
              <div className="amount-section-title">ÖDEME DETAYLARI</div>
              <div className="amount-row">
                <span>Toplam Tutar:</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              {payment.paidAmount && payment.paidAmount > 0 && (
                <div className="amount-row">
                  <span>Önceden Ödenen:</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(payment.paidAmount)}</span>
                </div>
              )}
              <div className="amount-row total">
                <span>Tahsil Edilen Tutar:</span>
                <span>
                  {formatCurrency(paidAmount)}
                  <span className="paid-badge">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ÖDENDİ
                  </span>
                </span>
              </div>
              {payment.amount - (payment.paidAmount || 0) - paidAmount > 0 && (
                <div className="amount-row" style={{ fontSize: '16px', color: '#dc2626', fontWeight: '600' }}>
                  <span>Kalan Bakiye:</span>
                  <span>{formatCurrency(payment.amount - (payment.paidAmount || 0) - paidAmount)}</span>
                </div>
              )}
            </div>

            {/* Declaration */}
            <div className="declaration">
              ✓ Yukarıda belirtilen tutarı {getPaymentMethodText(paymentMethod)} yöntemi ile eksiksiz olarak tahsil ettim.
            </div>

            {/* Footer */}
            <div className="footer">
              <div className="signatures">
                <div className="signature-box">
                  <div className="signature-line">
                    Yetkili İmza ve Kaşe
                  </div>
                  <div className="signature-label">Tahsil Eden</div>
                </div>
                <div className="signature-box">
                  <div className="signature-line">
                    İmza
                  </div>
                  <div className="signature-label">Ödeyen / Veli</div>
                </div>
              </div>

              <div className="print-info">
                <div className="qr-placeholder">QR Kod</div>
                <div className="print-date">
                  Yazdırma: {new Date().toLocaleDateString('tr-TR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="authenticity-note">
                  Bu belge elektronik ortamda oluşturulmuş olup, geçerlilik için imza ve kaşe gereklidir.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
