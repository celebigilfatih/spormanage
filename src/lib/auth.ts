import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole)
  }

  static isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN
  }

  static canManagePayments(userRole: UserRole): boolean {
    return [UserRole.ADMIN, UserRole.ACCOUNTING].includes(userRole)
  }

  static canManageStudents(userRole: UserRole): boolean {
    return [UserRole.ADMIN, UserRole.SECRETARY].includes(userRole)
  }

  static canManageTraining(userRole: UserRole): boolean {
    return [UserRole.ADMIN, UserRole.TRAINER, UserRole.SECRETARY].includes(userRole)
  }
}