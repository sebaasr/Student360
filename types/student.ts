export interface RosterStudent {
  id: string;
  name: string;
  preferredName: string | null;
  email: string;
  yearLevel: number;
  aoc: string | null;
  academicStanding: string;
  currentTermContract: {
    status: string;
    signedByStudent: boolean;
    signedByAdvisor: boolean;
  } | null;
  lastAdvisingDate: string | null;
  openFlagsCount: number;
  flagTypes: string[];
  brightFuturesStatus: "green" | "yellow" | "red" | null;
  priority: "high" | "medium" | "low";
}

export interface RosterStats {
  total: number;
  contractsSigned: number;
  contractsPending: number;
  metThisTerm: number;
  notMetThisTerm: number;
  openFlags: number;
}

export interface RosterResponse {
  stats: RosterStats;
  students: RosterStudent[];
}

export type Priority = "high" | "medium" | "low";
