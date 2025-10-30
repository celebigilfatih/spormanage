// Enums (matching Prisma schema)
export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTING = 'ACCOUNTING',
  TRAINER = 'TRAINER',
  SECRETARY = 'SECRETARY'
}

export enum FeePeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CHEQUE = 'CHEQUE'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum NoteType {
  GENERAL = 'GENERAL',
  HEALTH = 'HEALTH',
  BEHAVIOR = 'BEHAVIOR',
  PAYMENT = 'PAYMENT',
  ACADEMIC = 'ACADEMIC'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
  LATE = 'LATE'
}

export enum NotificationType {
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  ATTENDANCE_REMINDER = 'ATTENDANCE_REMINDER',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
  TRAINING_CANCELLED = 'TRAINING_CANCELLED'
}

export enum NotificationMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Prisma model types - will be generated after DB connection
export interface User {
  id: string
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  phone?: string
  birthDate?: Date
  groupId?: string
  isActive: boolean
  enrollmentDate: Date
  createdAt: Date
  updatedAt: Date
  createdById: string
  group?: Group
  parents?: Parent[]
  payments?: Payment[]
  notes?: Note[]
  attendances?: Attendance[]
  groupHistories?: GroupHistory[]
  _count?: {
    payments: number
    notes: number
    attendances: number
  }
}

export interface Parent {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  relationship: string
  isEmergency: boolean
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
  students?: Student[]
}

export interface Group {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  students?: Student[]
  feeTypes?: FeeType[]
  trainings?: Training[]
  _count?: {
    students: number
  }
}

export interface FeeType {
  id: string
  name: string
  amount: number
  period: FeePeriod
  groupId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  group?: Group
  payments?: Payment[]
}

export interface Payment {
  id: string
  studentId: string
  feeTypeId: string
  amount: number
  dueDate: Date
  paidDate?: Date
  paidAmount?: number
  paymentMethod?: PaymentMethod
  status: PaymentStatus
  referenceNumber?: string
  notes?: string
  receiptUrl?: string
  createdAt: Date
  updatedAt: Date
  createdById: string
  student?: Student
  feeType?: FeeType
  createdBy?: User
}

export interface Note {
  id: string
  studentId: string
  title: string
  content: string
  type: NoteType
  isPinned: boolean
  isImportant: boolean
  createdAt: Date
  updatedAt: Date
  createdById: string
  student?: Student
  createdBy?: User
}

export interface Training {
  id: string
  groupId: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  group?: Group
  sessions?: TrainingSession[]
}

export interface TrainingSession {
  id: string
  trainingId: string
  date: Date
  startTime: Date
  endTime: Date
  location?: string
  notes?: string
  isCancelled: boolean
  createdAt: Date
  updatedAt: Date
  training?: Training
  attendances?: Attendance[]
  _count?: {
    attendances: number
  }
}

export interface Attendance {
  id: string
  studentId: string
  sessionId: string
  status: AttendanceStatus
  notes?: string
  excuseReason?: string
  createdAt: Date
  updatedAt: Date
  createdById: string
  student?: Student
  session?: TrainingSession
  createdBy?: User
}

export interface Notification {
  id: string
  studentId?: string
  title: string
  message: string
  type: NotificationType
  method: NotificationMethod
  status: NotificationStatus
  scheduledAt?: Date
  sentAt?: Date
  recipientEmail?: string
  recipientPhone?: string
  createdAt: Date
  updatedAt: Date
  createdById: string
  student?: Student
  createdBy?: User
}

export interface GroupHistory {
  id: string
  studentId: string
  groupId: string
  startDate: Date
  endDate?: Date
  reason?: string
  createdAt: Date
  student?: Student
  group?: Group
}

// Form data types
export interface StudentFormData {
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  groupId?: string
  parents: ParentFormData[]
}

export interface ParentFormData {
  id?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  relationship: string
  isEmergency: boolean
  isPrimary: boolean
}

export interface PaymentFormData {
  studentId: string
  feeTypeId: string
  amount: number
  dueDate: string
  paymentMethod?: PaymentMethod
  notes?: string
}

export interface NoteFormData {
  studentId: string
  title: string
  content: string
  type: NoteType
  isPinned?: boolean
  isImportant?: boolean
}

export interface TrainingFormData {
  groupId: string
  name: string
  description?: string
  sessions: TrainingSessionFormData[]
}

export interface TrainingSessionFormData {
  date: string
  startTime: string
  endTime: string
  location?: string
  notes?: string
}

export interface AttendanceFormData {
  studentId: string
  sessionId: string
  status: AttendanceStatus
  notes?: string
  excuseReason?: string
}

export interface BulkPaymentData {
  feeTypeId: string
  studentIds: string[]
  amount: number
  dueDate: string
}

export interface NotificationFormData {
  title: string
  message: string
  type: NotificationType
  method: NotificationMethod
  studentIds?: string[]
  scheduledAt?: string
}

// Dashboard/Report types
export interface PaymentSummary {
  totalPending: number
  totalOverdue: number
  totalPaid: number
  monthlyTotal: number
}

export interface AttendanceSummary {
  totalPresent: number
  totalAbsent: number
  totalExcused: number
  attendanceRate: number
}

export interface StudentWithBalance extends Student {
  currentBalance: number
  overdueAmount: number
  lastPaymentDate?: Date
}

export interface GroupWithStats extends Group {
  studentCount: number
  activeStudentCount: number
  totalRevenue: number
  averageAttendance: number
}

