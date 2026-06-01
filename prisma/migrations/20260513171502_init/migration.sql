-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "localAddress" TEXT,
    "enrollmentStatus" TEXT NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "declaredAoc" TEXT,
    "aocDeclaredAt" DATETIME,
    "cumulativeGpa" REAL,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "creditsAttempted" INTEGER NOT NULL DEFAULT 0,
    "academicStanding" TEXT NOT NULL DEFAULT 'good_standing',
    "isFirstGeneration" BOOLEAN NOT NULL DEFAULT false,
    "isStudentAthlete" BOOLEAN NOT NULL DEFAULT false,
    "athleteSport" TEXT,
    "advisorId" TEXT,
    "brightFuturesAward" TEXT,
    "brightFuturesActive" BOOLEAN NOT NULL DEFAULT false,
    "bannerSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemesterGpa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termCode" TEXT NOT NULL,
    "gpa" REAL NOT NULL,
    "credits" INTEGER NOT NULL,
    "standing" TEXT NOT NULL,
    CONSTRAINT "SemesterGpa_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "signedByStudent" BOOLEAN NOT NULL DEFAULT false,
    "signedByAdvisor" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" DATETIME,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" DATETIME,
    CONSTRAINT "Contract_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "instructorName" TEXT,
    CONSTRAINT "ContractCourse_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DegreeProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "totalCreditsRequired" INTEGER NOT NULL DEFAULT 120,
    "totalCreditsEarned" INTEGER NOT NULL DEFAULT 0,
    "genEdRequired" INTEGER NOT NULL DEFAULT 20,
    "genEdCompleted" INTEGER NOT NULL DEFAULT 0,
    "aocName" TEXT,
    "aocCreditRequired" INTEGER NOT NULL DEFAULT 40,
    "aocCreditCompleted" INTEGER NOT NULL DEFAULT 0,
    "aocPercentComplete" REAL NOT NULL DEFAULT 0,
    "ispsRequired" INTEGER NOT NULL DEFAULT 3,
    "ispsCompleted" INTEGER NOT NULL DEFAULT 0,
    "thesisStatus" TEXT NOT NULL DEFAULT 'not_started',
    "thesisSponsor" TEXT,
    "projectedGradTerm" TEXT,
    "projectedGradTermCode" TEXT,
    "onTrackForGraduation" BOOLEAN NOT NULL DEFAULT true,
    "degreeWorksAuditAt" DATETIME,
    "syncedAt" DATETIME,
    CONSTRAINT "DegreeProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ISPRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "degreeProgressId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "supervisorName" TEXT,
    CONSTRAINT "ISPRecord_degreeProgressId_fkey" FOREIGN KEY ("degreeProgressId") REFERENCES "DegreeProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MinorProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "degreeProgressId" TEXT NOT NULL,
    "minorName" TEXT NOT NULL,
    "isDeclared" BOOLEAN NOT NULL DEFAULT false,
    "coursesRequired" INTEGER NOT NULL,
    "coursesCompleted" INTEGER NOT NULL,
    "percentComplete" REAL NOT NULL,
    "coursesNeeded" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "MinorProgress_degreeProgressId_fkey" FOREIGN KEY ("degreeProgressId") REFERENCES "DegreeProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvisingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "advisorId" TEXT,
    "advisorName" TEXT NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "duration" INTEGER,
    "meetingType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "noteText" TEXT,
    "noteType" TEXT,
    "termCode" TEXT,
    "navigateId" TEXT,
    "syncedAt" DATETIME,
    CONSTRAINT "AdvisingRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EarlyAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "raisedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" DATETIME,
    "notes" TEXT,
    "navigateId" TEXT,
    "syncedAt" DATETIME,
    CONSTRAINT "EarlyAlert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termCode" TEXT NOT NULL,
    "evaluationText" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "sourceId" TEXT,
    "syncedAt" DATETIME,
    CONSTRAINT "Evaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TutoringSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "sessionDate" DATETIME NOT NULL,
    "durationMins" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "courseCode" TEXT,
    "tutorName" TEXT,
    "sessionType" TEXT NOT NULL,
    "wasNoShow" BOOLEAN NOT NULL DEFAULT false,
    "term" TEXT NOT NULL,
    "termCode" TEXT NOT NULL,
    "knackId" TEXT,
    "syncedAt" DATETIME,
    CONSTRAINT "TutoringSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SSCVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "visitType" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "staffName" TEXT,
    "notes" TEXT,
    "term" TEXT NOT NULL,
    "termCode" TEXT NOT NULL,
    "knackId" TEXT,
    "syncedAt" DATETIME,
    CONSTRAINT "SSCVisit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AcademicCoach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "coachEmail" TEXT,
    "assignedAt" DATETIME,
    "syncedAt" DATETIME,
    CONSTRAINT "AcademicCoach_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AthleticsRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "eligibilityStatus" TEXT NOT NULL,
    "gpaRequired" REAL NOT NULL DEFAULT 2.0,
    "creditLoadRequired" INTEGER NOT NULL DEFAULT 12,
    "semesterCertHistory" TEXT NOT NULL DEFAULT '[]',
    "farNotes" TEXT,
    "syncedAt" DATETIME,
    CONSTRAINT "AthleticsRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "flagType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" DATETIME NOT NULL,
    "clearedAt" DATETIME,
    "syncedAt" DATETIME,
    CONSTRAINT "FinancialFlag_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PredictiveInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "insightCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "subtext" TEXT,
    "ctaText" TEXT,
    "severity" TEXT NOT NULL,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" DATETIME,
    "isDiscussed" BOOLEAN NOT NULL DEFAULT false,
    "discussedAt" DATETIME,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "PredictiveInsight_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ncfUsername" TEXT,
    "accessTier" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "studentId" TEXT,
    "action" TEXT NOT NULL,
    "panelName" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connector" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'scheduler'
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_advisorId_idx" ON "Student"("advisorId");

-- CreateIndex
CREATE INDEX "Student_academicStanding_idx" ON "Student"("academicStanding");

-- CreateIndex
CREATE INDEX "Student_enrollmentStatus_idx" ON "Student"("enrollmentStatus");

-- CreateIndex
CREATE INDEX "Student_yearLevel_idx" ON "Student"("yearLevel");

-- CreateIndex
CREATE INDEX "SemesterGpa_studentId_idx" ON "SemesterGpa"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterGpa_studentId_termCode_key" ON "SemesterGpa"("studentId", "termCode");

-- CreateIndex
CREATE INDEX "Contract_studentId_idx" ON "Contract"("studentId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_studentId_termCode_key" ON "Contract"("studentId", "termCode");

-- CreateIndex
CREATE INDEX "ContractCourse_contractId_idx" ON "ContractCourse"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "DegreeProgress_studentId_key" ON "DegreeProgress"("studentId");

-- CreateIndex
CREATE INDEX "ISPRecord_degreeProgressId_idx" ON "ISPRecord"("degreeProgressId");

-- CreateIndex
CREATE INDEX "MinorProgress_degreeProgressId_idx" ON "MinorProgress"("degreeProgressId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisingRecord_navigateId_key" ON "AdvisingRecord"("navigateId");

-- CreateIndex
CREATE INDEX "AdvisingRecord_studentId_idx" ON "AdvisingRecord"("studentId");

-- CreateIndex
CREATE INDEX "AdvisingRecord_appointmentDate_idx" ON "AdvisingRecord"("appointmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "EarlyAlert_navigateId_key" ON "EarlyAlert"("navigateId");

-- CreateIndex
CREATE INDEX "EarlyAlert_studentId_idx" ON "EarlyAlert"("studentId");

-- CreateIndex
CREATE INDEX "EarlyAlert_status_idx" ON "EarlyAlert"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_sourceId_key" ON "Evaluation"("sourceId");

-- CreateIndex
CREATE INDEX "Evaluation_studentId_idx" ON "Evaluation"("studentId");

-- CreateIndex
CREATE INDEX "Evaluation_termCode_idx" ON "Evaluation"("termCode");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringSession_knackId_key" ON "TutoringSession"("knackId");

-- CreateIndex
CREATE INDEX "TutoringSession_studentId_idx" ON "TutoringSession"("studentId");

-- CreateIndex
CREATE INDEX "TutoringSession_termCode_idx" ON "TutoringSession"("termCode");

-- CreateIndex
CREATE INDEX "TutoringSession_sessionDate_idx" ON "TutoringSession"("sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "SSCVisit_knackId_key" ON "SSCVisit"("knackId");

-- CreateIndex
CREATE INDEX "SSCVisit_studentId_idx" ON "SSCVisit"("studentId");

-- CreateIndex
CREATE INDEX "SSCVisit_termCode_idx" ON "SSCVisit"("termCode");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicCoach_studentId_key" ON "AcademicCoach"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AthleticsRecord_studentId_key" ON "AthleticsRecord"("studentId");

-- CreateIndex
CREATE INDEX "FinancialFlag_studentId_idx" ON "FinancialFlag"("studentId");

-- CreateIndex
CREATE INDEX "FinancialFlag_isActive_idx" ON "FinancialFlag"("isActive");

-- CreateIndex
CREATE INDEX "PredictiveInsight_studentId_idx" ON "PredictiveInsight"("studentId");

-- CreateIndex
CREATE INDEX "PredictiveInsight_isDismissed_idx" ON "PredictiveInsight"("isDismissed");

-- CreateIndex
CREATE INDEX "PredictiveInsight_insightType_idx" ON "PredictiveInsight"("insightType");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_ncfUsername_key" ON "User"("ncfUsername");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_studentId_idx" ON "AuditLog"("studentId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncRun_connector_idx" ON "SyncRun"("connector");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");
