# Training & Attendance Management System Design
## Football Academy Application

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Enhanced Data Model](#enhanced-data-model)
3. [Database Schema (Prisma)](#database-schema)
4. [API Architecture](#api-architecture)
5. [UI/UX Workflow](#uiux-workflow)
6. [Implementation Timeline](#implementation-timeline)

---

## System Overview

### Core Problem Solved
- ❌ Coaches manually creating training sessions weekly
- ❌ Manual attendance marking for each player
- ❌ Difficulty managing one-time changes
- ❌ No attendance analytics

### Core Solution
- ✅ **Group-Based Templates**: Define training once (days, time, field)
- ✅ **Automatic Generation**: Sessions auto-created based on template
- ✅ **Smart Attendance**: One-click marking with auto-detection of today's session
- ✅ **Exception Handling**: One-time changes without affecting template
- ✅ **Analytics Dashboard**: Attendance trends, absence warnings

---

## Enhanced Data Model

### 1. **Group** (Training Template)
```typescript
Group {
  id: String                    // Unique identifier
  name: String                  // U10, U12, U14, etc.
  branchId: String              // Link to branch
  
  // Training Template (Core concept)
  trainingDays: String[]        // ["Monday", "Wednesday", "Friday"]
  trainingStartTime: String     // "09:00" (24-hour format)
  trainingEndTime: String       // "10:30"
  fieldId: String               // Foreign key to Field
  locationId: String            // Foreign key to Location
  trainingType: String          // "Technical", "Tactical", "Conditioning", etc.
  
  // Coach Assignment
  coachId: String               // Primary coach
  assistantCoachId: String      // Optional assistant coach
  
  // Metadata
  isActive: Boolean             // Soft delete flag
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  students: Student[]
  trainingSessions: TrainingSession[]
  trainingExceptions: TrainingException[]
  field: Field
  location: Location
}
```

### 2. **TrainingSession** (Auto-Generated or Manual)
```typescript
TrainingSession {
  id: String
  groupId: String
  date: DateTime                // Specific date (e.g., 2026-01-08)
  startTime: String             // Actual start time (may differ from template)
  endTime: String               // Actual end time
  fieldId: String               // May differ from template (override)
  locationId: String            // May differ from template (override)
  status: TrainingSessionStatus // "Planned", "Completed", "Cancelled"
  
  // Attendance Status
  attendanceTaken: Boolean      // Has attendance been recorded?
  attendanceTakenAt: DateTime   // When was attendance recorded?
  
  // Exception Reference (if this is a one-time change)
  exceptionId: String           // Links to TrainingException if applicable
  
  // Metadata
  generatedAutomatically: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  group: Group
  attendances: Attendance[]
  field: Field
  location: Location
}
```

### 3. **Attendance** (Marking System)
```typescript
Attendance {
  id: String
  sessionId: String
  studentId: String
  status: AttendanceStatus      // "PRESENT", "ABSENT", "LATE", "EXCUSED"
  
  // Details
  markedBy: String              // Coach ID who marked attendance
  markedAt: DateTime
  notes: String                 // Optional: reason for absence/excuse
  
  // Analytics
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  session: TrainingSession
  student: Student
  markedByUser: User
}
```

### 4. **TrainingException** (One-Time Changes)
```typescript
TrainingException {
  id: String
  groupId: String
  date: DateTime                // Date of exception
  
  // Exception Type
  type: ExceptionType           // "CANCELLED", "TIME_CHANGE", "FIELD_CHANGE", "LOCATION_CHANGE", "EXTRA_SESSION"
  
  // Details for Changes
  newStartTime: String          // Only for TIME_CHANGE
  newEndTime: String            // Only for TIME_CHANGE
  newFieldId: String            // Only for FIELD_CHANGE
  newLocationId: String         // Only for LOCATION_CHANGE
  
  // Metadata
  reason: String                // "Weather", "Coach sick", "Facility unavailable", etc.
  createdBy: String             // Coach/Admin ID
  createdAt: DateTime
  
  // Relations
  group: Group
  trainingSession: TrainingSession  // Links to affected session
  field: Field
  location: Location
}
```

### 5. **Field** (Venue/Facility)
```typescript
Field {
  id: String
  branchId: String
  name: String                  // "Field 1", "Field 2", etc.
  capacity: Int                 // Max players
  location: String              // GPS coordinates or address
  isActive: Boolean
  createdAt: DateTime
  
  // Relations
  branch: Branch
  trainingSessions: TrainingSession[]
  trainingExceptions: TrainingException[]
}
```

### 6. **Location** (Training Location/Facility)
```typescript
Location {
  id: String
  branchId: String
  name: String                  // "Main Stadium", "Training Center", etc.
  address: String
  phone: String
  isActive: Boolean
  createdAt: DateTime
  
  // Relations
  branch: Branch
  trainingSessions: TrainingSession[]
  trainingExceptions: TrainingException[]
}
```

### 7. **AttendanceAnalytics** (Derived/Cached Data)
```typescript
AttendanceAnalytics {
  id: String
  studentId: String
  month: Int                    // 1-12
  year: Int                     // 2026
  
  // Metrics
  totalSessions: Int
  presentCount: Int
  absentCount: Int
  lateCount: Int
  excusedCount: Int
  attendancePercentage: Float   // (present + excused) / total * 100
  
  // Warnings
  consecutiveAbsences: Int      // Count of consecutive absences
  hasWarning: Boolean           // true if >= 3 consecutive absences
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## Database Schema

### Updated Prisma Schema Changes

```prisma
// Add to existing schema.prisma

enum TrainingSessionStatus {
  PLANNED
  COMPLETED
  CANCELLED
}

enum ExceptionType {
  CANCELLED
  TIME_CHANGE
  FIELD_CHANGE
  LOCATION_CHANGE
  EXTRA_SESSION
}

// Update Group model
model Group {
  id          String    @id @default(cuid())
  name        String
  description String?
  branchId    String?
  
  // NEW: Training Template Fields
  trainingDays    String[]  @default([]) // ["Monday", "Wednesday", "Friday"]
  trainingStartTime String?  // "09:00"
  trainingEndTime   String?   // "10:30"
  fieldId         String?
  locationId      String?
  trainingType    String?    // "Technical", "Tactical", etc.
  
  coachId             String?
  assistantCoachId    String?
  isActive            Boolean @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  coach               Trainer?            @relation("GroupCoach", fields: [coachId], references: [id])
  assistantCoach      Trainer?            @relation("GroupAssistantCoach", fields: [assistantCoachId], references: [id])
  branch              Branch?             @relation(fields: [branchId], references: [id])
  field               Field?              @relation(fields: [fieldId], references: [id])
  location            Location?           @relation(fields: [locationId], references: [id])
  
  students            Student[]
  trainingSessions    TrainingSession[]
  trainingExceptions  TrainingException[]
  feeTypes            FeeType[]
  
  @@map("groups")
}

// NEW: TrainingSession model
model TrainingSession {
  id                      String                  @id @default(cuid())
  groupId                 String
  date                    DateTime
  startTime               String
  endTime                 String
  fieldId                 String?
  locationId              String?
  status                  TrainingSessionStatus   @default(PLANNED)
  
  attendanceTaken         Boolean                 @default(false)
  attendanceTakenAt       DateTime?
  exceptionId             String?
  
  generatedAutomatically  Boolean                 @default(true)
  
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt
  
  // Relations
  group                   Group                   @relation(fields: [groupId], references: [id], onDelete: Cascade)
  field                   Field?                  @relation(fields: [fieldId], references: [id])
  location                Location?               @relation(fields: [locationId], references: [id])
  exception               TrainingException?      @relation(fields: [exceptionId], references: [id])
  attendances             Attendance[]
  
  @@index([groupId, date])
  @@index([date, status])
  @@map("training_sessions")
}

// NEW: TrainingException model
model TrainingException {
  id                String        @id @default(cuid())
  groupId           String
  date              DateTime
  
  type              ExceptionType
  
  newStartTime      String?
  newEndTime        String?
  newFieldId        String?
  newLocationId     String?
  
  reason            String?
  createdBy         String
  
  createdAt         DateTime      @default(now())
  
  // Relations
  group             Group         @relation(fields: [groupId], references: [id], onDelete: Cascade)
  trainingSession   TrainingSession[]
  field             Field?        @relation(fields: [newFieldId], references: [id])
  location          Location?     @relation(fields: [newLocationId], references: [id])
  createdByUser     User          @relation(fields: [createdBy], references: [id])
  
  @@unique([groupId, date]) // Only one exception per day per group
  @@map("training_exceptions")
}

// NEW: Field model
model Field {
  id        String    @id @default(cuid())
  branchId  String?
  name      String
  capacity  Int?
  location  String?
  isActive  Boolean   @default(true)
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Relations
  branch              Branch?             @relation(fields: [branchId], references: [id])
  trainingSessions    TrainingSession[]
  trainingExceptions  TrainingException[]
  groups              Group[]
  
  @@map("fields")
}

// NEW: Location model
model Location {
  id        String    @id @default(cuid())
  branchId  String?
  name      String
  address   String?
  phone     String?
  isActive  Boolean   @default(true)
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Relations
  branch              Branch?             @relation(fields: [branchId], references: [id])
  trainingSessions    TrainingSession[]
  trainingExceptions  TrainingException[]
  groups              Group[]
  
  @@map("locations")
}

// Update Attendance model
model Attendance {
  id          String          @id @default(cuid())
  studentId   String
  sessionId   String
  
  status      AttendanceStatus @default(PRESENT)
  
  markedBy    String?
  markedAt    DateTime?
  notes       String?
  
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  // Relations
  student     Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  session     TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  markedByUser User?          @relation(fields: [markedBy], references: [id])
  
  @@unique([sessionId, studentId])
  @@index([sessionId])
  @@index([studentId])
  @@map("attendances")
}

// NEW: AttendanceAnalytics model
model AttendanceAnalytics {
  id                    String  @id @default(cuid())
  studentId             String
  month                 Int
  year                  Int
  
  totalSessions         Int     @default(0)
  presentCount          Int     @default(0)
  absentCount           Int     @default(0)
  lateCount             Int     @default(0)
  excusedCount          Int     @default(0)
  attendancePercentage  Float   @default(0)
  
  consecutiveAbsences   Int     @default(0)
  hasWarning            Boolean @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, month, year])
  @@map("attendance_analytics")
}

// Update Branch model to include relations
model Branch {
  // ... existing fields ...
  
  fields    Field[]
  locations Location[]
}

// Update User model to include relation
model User {
  // ... existing fields ...
  
  markedAttendances TrainingException[] // Exceptions created by user
}
```

---

## API Architecture

### 1. Training Session Management Endpoints

#### Auto-Generate Training Sessions
```
POST /api/training-sessions/generate
Body: { groupId, startDate, endDate }
Response: { generated: number, sessions: TrainingSession[] }

Logic:
- Query group template (trainingDays, startTime, endTime, etc.)
- Iterate through date range
- Find all matching days
- Check for existing sessions (avoid duplicates)
- Create sessions automatically
```

#### List Training Sessions (for coach)
```
GET /api/training-sessions?groupId=X&month=1&year=2026
Response: { sessions: TrainingSession[], group: Group }

Logic:
- Filter by groupId and date range
- Include exception overrides (if any)
- Order by date DESC
```

#### Today's Training (Quick Access)
```
GET /api/training-sessions/today
Response: { session: TrainingSession, students: Student[], group: Group }

Logic:
- Get current date/time
- Find training session for coach's group(s) for today
- Check for exceptions (time/field changes)
- Return session with all enrolled students
```

#### Get Single Session with Attendance
```
GET /api/training-sessions/:id/with-attendance
Response: { 
  session: TrainingSession,
  group: Group,
  students: [{
    id, firstName, lastName,
    attendance: { status, notes } || null
  }]
}
```

---

### 2. Attendance Management Endpoints

#### Mark Attendance (Batch)
```
POST /api/attendances/mark
Body: {
  sessionId: String,
  attendance: [
    { studentId: "X", status: "PRESENT" },
    { studentId: "Y", status: "ABSENT", notes: "Sick" },
    { studentId: "Z", status: "LATE" }
  ]
}
Response: { success: true, marked: number, session: TrainingSession }

Logic:
- Validate session exists and is not completed
- Create/update attendance records
- Mark session as completed (attendanceTaken = true)
- Trigger analytics recalculation
```

#### Quick Mark Attendance (for today)
```
POST /api/attendances/mark-today
Body: {
  attendance: [
    { studentId: "X", status: "PRESENT" }
  ]
}
Response: { success: true }

Logic:
- Auto-detect today's training session for current coach
- Mark attendance
- Update session status
```

#### Get Attendance Record
```
GET /api/attendances?sessionId=X&studentId=Y
Response: { attendance: Attendance }
```

---

### 3. Training Exception Management

#### Create Exception (one-time change)
```
POST /api/training-exceptions
Body: {
  groupId: String,
  date: DateTime,
  type: "CANCELLED" | "TIME_CHANGE" | "FIELD_CHANGE" | "LOCATION_CHANGE" | "EXTRA_SESSION",
  newStartTime?: String,
  newEndTime?: String,
  newFieldId?: String,
  newLocationId?: String,
  reason: String
}
Response: { exception: TrainingException, session: TrainingSession }

Logic:
- Check if training session exists for date
- Create exception record
- Update related training session
- If CANCELLED: update session status to CANCELLED
- If TIME/FIELD/LOCATION_CHANGE: update session fields
- If EXTRA_SESSION: create new training session
```

#### List Exceptions
```
GET /api/training-exceptions?groupId=X&month=1
Response: { exceptions: TrainingException[] }
```

#### Delete Exception (revert to template)
```
DELETE /api/training-exceptions/:id
Response: { success: true, session: TrainingSession }

Logic:
- Delete exception
- Restore training session to template values
- If CANCELLED: set back to PLANNED
```

---

### 4. Analytics & Reporting

#### Student Attendance Summary
```
GET /api/analytics/attendance?studentId=X&month=1&year=2026
Response: {
  analytics: AttendanceAnalytics,
  monthlyTrend: { weeks: [{ week, percentage }] },
  warnings: { consecutiveAbsences: 3, status: "warning" }
}
```

#### Group Attendance Report
```
GET /api/analytics/group/:groupId?month=1&year=2026
Response: {
  group: Group,
  students: [{
    id, name, presentCount, absentCount, percentage, warnings
  }],
  summary: { avgAttendance: 85.2, presentCount: 150, absentCount: 28 }
}
```

#### Conflict Detection
```
GET /api/training-sessions/conflicts?groupId=X&date=2026-01-08
Response: { 
  hasConflicts: boolean,
  conflicts: [
    { type: "SAME_TIME_SAME_FIELD", group: "U12", time: "10:00" }
  ]
}
```

---

## UI/UX Workflow

### 1. **Group Creation Screen** (Enhanced)

```
Form Fields:
├─ Group Name (U10, U12, U14)
├─ Branch (Dropdown)
├─ Training Template Section
│  ├─ Select Days (Multi-checkbox: Mon, Tue, Wed, Thu, Fri, Sat, Sun)
│  ├─ Start Time (HH:MM picker)
│  ├─ End Time (HH:MM picker)
│  ├─ Training Type (Dropdown: Technical, Tactical, Conditioning, Match Day, Recovery)
│  ├─ Field (Dropdown with facility lookup)
│  └─ Location (Dropdown with address)
├─ Coach Assignment
│  ├─ Primary Coach (Dropdown)
│  └─ Assistant Coach (Optional Dropdown)
├─ Button: "Generate Training Sessions"
│  └─ Shows confirmation: "Generate 52 sessions for the next year?"
└─ Save Button

Logic:
- After save, trigger generation of training sessions
- Show success message with count
```

### 2. **Coach Dashboard - Today's Training** (NEW)

```
Screen: /trainings/today

Layout (Navy Blue Background with White Text):
┌─────────────────────────────────────────┐
│ TODAY'S TRAINING                        │
│ Wednesday, January 8, 2026              │
├─────────────────────────────────────────┤
│                                         │
│ Group: U12 Group A                      │
│ Coach: Mehmet Yıldız                   │
│ Time: 10:00 - 11:30                    │
│ Field: Field 2                          │
│ Location: Main Stadium                  │
│                                         │
│ [⚠️ Exception: Field changed from 1]    │
│                                         │
├─────────────────────────────────────────┤
│ ATTENDANCE MARKING                      │
├─────────────────────────────────────────┤
│                                         │
│ [ ] 1. Ahmet Arslan      [ PRESENT ]   │
│ [ ] 2. Burak Karaağaç    [ ABSENT ]    │
│ [ ] 3. Cem Doğan         [ LATE ]      │
│ [ ] 4. Deniz Yılmaz      [ EXCUSED ]   │
│ [ ] 5. Eren Şahin        [ PRESENT ]   │
│ ...                                     │
│                                         │
│ ┌─────────────────────────────┐        │
│ │ Quick Mark: [PRESENT] x 15  │        │
│ │             [ABSENT]  x 2   │        │
│ │             [LATE]    x 1   │        │
│ │             [EXCUSED] x 0   │        │
│ └─────────────────────────────┘        │
│                                         │
│ [SAVE ATTENDANCE] [CANCEL]              │
│                                         │
└─────────────────────────────────────────┘

Features:
- Auto-populates with today's session
- Shows all enrolled students
- Highlights any time/field exceptions
- One-click status updates
- Bulk actions (mark all present, etc.)
```

### 3. **Training Session Management** (NEW)

```
Screen: /trainings/calendar

View Modes:
├─ Monthly Calendar
├─ Weekly List
└─ Group List

For each session:
├─ Date & Time
├─ Group Name
├─ Field & Location
├─ Status Badge (Planned, Completed, Cancelled)
├─ Action Menu:
│  ├─ Edit Exception
│  ├─ Cancel Training
│  ├─ Change Time
│  ├─ Change Field
│  ├─ Add Extra Session
│  └─ Mark Attendance
```

### 4. **Exception Management Screen** (NEW)

```
Modal: Create Training Exception

Exception Type (Radio):
├─ ○ Cancel Training
├─ ○ Change Time
│    └─ New Start Time | New End Time
├─ ○ Change Field
│    └─ New Field Selection
├─ ○ Change Location
│    └─ New Location Selection
└─ ○ Add Extra Session

Reason: (Text field)
  "Weather", "Coach sick", "Facility issue", "Special event", etc.

Conflict Check:
┌─────────────────────────────┐
│ ⚠️ Potential Conflicts:      │
│ • U14 Group B also uses     │
│   Field 2 at 10:00-11:30    │
└─────────────────────────────┘

[SAVE EXCEPTION] [CANCEL]
```

### 5. **Attendance Analytics Screen** (NEW)

```
Screen: /analytics/attendance

Left Sidebar:
├─ Group Selection
├─ Date Range Picker
└─ Filters

Main Content:
┌─────────────────────────────────────────┐
│ ATTENDANCE SUMMARY                      │
│ U12 Group A - January 2026              │
├─────────────────────────────────────────┤
│                                         │
│ Total Sessions: 8                       │
│ Present: 6  | Absent: 1  | Late: 1     │
│ Attendance Rate: 87.5%                  │
│                                         │
├─────────────────────────────────────────┤
│ STUDENT ATTENDANCE LIST                 │
├─────────────────────────────────────────┤
│                                         │
│ Name          | Present | Absent | %   │
│ ─────────────────────────────────────   │
│ Ahmet Arslan  |    8    |   0    | 100%│
│ Burak Karaağ  |    6    |   1    | 85% │
│ Cem Doğan     |    6    |   2    | 75% │ ⚠️ Warning
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📊 Monthly Trend (Graph)            ││
│ │ Week 1: 92% → Week 2: 88% →         ││
│ │ Week 3: 85% → Week 4: 87%           ││
│ └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Timeline

### Phase 1: Database & Core API (Week 1-2)
- [x] Update Prisma schema with new models
- [ ] Create migration for TrainingSession, Field, Location, TrainingException
- [ ] Implement automatic training session generation service
- [ ] Build API endpoints for training sessions

### Phase 2: Attendance System (Week 2-3)
- [ ] Implement attendance marking endpoints
- [ ] Build batch attendance API
- [ ] Add conflict detection logic
- [ ] Create analytics calculation service

### Phase 3: Exception Handling (Week 3)
- [ ] Implement one-time change logic
- [ ] Build exception management API
- [ ] Add revert-to-template functionality

### Phase 4: UI Components (Week 3-4)
- [ ] Enhanced Group Creation Form
- [ ] Today's Training dashboard
- [ ] Training calendar view
- [ ] Exception management modal
- [ ] Attendance marking interface

### Phase 5: Analytics & Reporting (Week 4)
- [ ] Attendance summary queries
- [ ] Analytics caching/optimization
- [ ] Reporting dashboards
- [ ] Export functionality

### Phase 6: Testing & Optimization (Week 5)
- [ ] Unit tests for generation logic
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Conflict detection testing

---

## Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **Group as Template** | Reduces redundant data entry; scales to multiple groups/branches |
| **Automatic Generation** | Eliminates manual session creation; ensures consistency |
| **Exception Pattern** | Provides flexibility without affecting base template; audit trail |
| **Analytics Model** | Pre-computed metrics for fast reporting; tracks trends |
| **Conflict Detection** | Prevents scheduling errors; warns coaches of overlaps |
| **One-Screen Attendance** | Minimizes friction; coaches focus on marking, not navigation |

---

## Migration Strategy

### For Existing Data:
1. Create a one-time migration script
2. Map existing trainings to groups (if applicable)
3. Convert historical attendance records
4. Backfill analytics data
5. Notify coaches of new system

---

## Notes for Implementation

- Use **transaction-based operations** for atomic updates (exception + session update)
- **Cache** analytics results (recalculate on attendance change only)
- Implement **conflict detection** as a pre-save validation
- Use **webhooks** to trigger analytics recalculation asynchronously
- Add **audit logging** for exception creation/deletion
- Consider **timezone handling** for international deployments
