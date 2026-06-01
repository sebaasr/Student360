import { computeBrightFuturesStatus } from "./bright-futures";

describe("BrightFutures status", () => {
  test("returns 'none' when no award", () => {
    const s = computeBrightFuturesStatus(null, false, 3.5, 15);
    expect(s.color).toBe("none");
  });

  test("returns 'green' when GPA comfortably above threshold", () => {
    const s = computeBrightFuturesStatus("academic_scholar", true, 3.85, 15);
    expect(s.color).toBe("green");
    expect(s.buffer).toBeCloseTo(0.85, 2);
  });

  test("returns 'yellow' when GPA within buffer of threshold", () => {
    const s = computeBrightFuturesStatus("academic_scholar", true, 3.1, 15);
    expect(s.color).toBe("yellow");
  });

  test("returns 'red' when GPA below threshold", () => {
    const s = computeBrightFuturesStatus("academic_scholar", true, 2.5, 15);
    expect(s.color).toBe("red");
  });

  test("returns 'red' when credits below minimum", () => {
    const s = computeBrightFuturesStatus("academic_scholar", true, 3.5, 8);
    expect(s.color).toBe("red");
    expect(s.creditsMet).toBe(false);
  });

  test("medallion threshold differs from academic", () => {
    // Medallion threshold is 2.75; yellow buffer is +0.20 (so green starts at 2.95)
    expect(computeBrightFuturesStatus("medallion_scholar", true, 3.0, 15).color).toBe("green");
    expect(computeBrightFuturesStatus("medallion_scholar", true, 2.85, 15).color).toBe("yellow");
    expect(computeBrightFuturesStatus("medallion_scholar", true, 2.5, 15).color).toBe("red");
  });
});
