import { canViewPanel, canViewStudent, TIER_PANELS, ACCESS_TIERS } from "./rbac";

describe("RBAC — canViewPanel", () => {
  test("faculty advisor cannot see athletics panel", () => {
    expect(canViewPanel(ACCESS_TIERS.FACULTY_ADVISOR, "athletics")).toBe(false);
  });

  test("registrar can see all common panels", () => {
    expect(canViewPanel(ACCESS_TIERS.REGISTRAR, "financial_flags")).toBe(true);
    expect(canViewPanel(ACCESS_TIERS.REGISTRAR, "evaluations")).toBe(true);
    expect(canViewPanel(ACCESS_TIERS.REGISTRAR, "athletics")).toBe(true);
  });

  test("financial aid can see only financial flags", () => {
    expect(TIER_PANELS[ACCESS_TIERS.FINANCIAL_AID]).toEqual(["financial_flags"]);
  });

  test("IT admin sees no student panels", () => {
    expect(TIER_PANELS[ACCESS_TIERS.IT_ADMIN]).toEqual([]);
  });
});

describe("RBAC — canViewStudent", () => {
  test("advisor can see their advisee", () => {
    expect(canViewStudent(1, "user-123", "user-123")).toBe(true);
  });

  test("advisor cannot see a student they don't advise", () => {
    expect(canViewStudent(1, "user-123", "user-456")).toBe(false);
  });

  test("tier 5+ sees all students", () => {
    expect(canViewStudent(5, "anyone", null)).toBe(true);
    expect(canViewStudent(8, "anyone", null)).toBe(true);
  });

  test("tier 9 (IT) cannot see student data", () => {
    expect(canViewStudent(9, "anyone", null)).toBe(false);
  });
});
