import { prisma } from "./prisma";

export interface AuditEntry {
  userId: string;
  studentId?: string;
  action: string;
  panelName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        studentId: entry.studentId,
        action: entry.action,
        panelName: entry.panelName,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
