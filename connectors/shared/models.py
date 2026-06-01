"""Shared dataclasses used to normalize source-system payloads."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class NormalizedStudent:
    id: str
    firstName: str
    lastName: str
    preferredName: Optional[str]
    email: str
    enrollmentStatus: str
    yearLevel: int
    declaredAoc: Optional[str]
    cumulativeGpa: Optional[float]
    creditsEarned: int
    creditsAttempted: int
    academicStanding: str
    isFirstGeneration: bool
    isStudentAthlete: bool
    athleteSport: Optional[str]
    advisorId: Optional[str]
    brightFuturesAward: Optional[str]
    brightFuturesActive: bool


@dataclass
class NormalizedTutoringSession:
    knackId: Optional[str]
    studentId: str
    sessionDate: datetime
    durationMins: int
    subject: str
    courseCode: Optional[str]
    tutorName: Optional[str]
    sessionType: str
    wasNoShow: bool
    term: str
    termCode: str
