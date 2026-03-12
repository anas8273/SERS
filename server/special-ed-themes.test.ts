import { describe, it, expect } from "vitest";

// Test special education standards
describe("Special Education Standards", () => {
  it("should have 11 standards for special_ed job", async () => {
    const { getStandardsForJob } = await import("../client/src/lib/all-jobs-standards");
    const standards = getStandardsForJob("special_ed");
    expect(standards).toBeDefined();
    expect(standards.length).toBe(11);
  });

  it("each standard should have id, title, and items", async () => {
    const { getStandardsForJob } = await import("../client/src/lib/all-jobs-standards");
    const standards = getStandardsForJob("special_ed");
    for (const s of standards) {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.items).toBeDefined();
      expect(s.items.length).toBeGreaterThan(0);
    }
  });

  it("each item should have subItems with suggestedEvidence", async () => {
    const { getStandardsForJob } = await import("../client/src/lib/all-jobs-standards");
    const standards = getStandardsForJob("special_ed");
    for (const s of standards) {
      for (const item of s.items) {
        expect(item.id).toBeTruthy();
        expect(item.text).toBeTruthy();
        expect(item.subItems).toBeDefined();
        expect(item.subItems.length).toBeGreaterThan(0);
        for (const sub of item.subItems) {
          expect(sub.id).toBeTruthy();
          expect(sub.title).toBeTruthy();
          expect(sub.suggestedEvidence).toBeDefined();
          expect(sub.suggestedEvidence.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("special_ed standards should have different subItems from teacher standards", async () => {
    const { SPECIAL_ED_STANDARDS } = await import("../client/src/lib/all-jobs-standards");
    const { STANDARDS: TEACHER_STANDARDS } = await import("../client/src/lib/standards-data");
    
    // Same number of standards (both 11)
    expect(SPECIAL_ED_STANDARDS.length).toBe(TEACHER_STANDARDS.length);
    
    // But different sub-items (at least some)
    let hasDifference = false;
    for (let i = 0; i < SPECIAL_ED_STANDARDS.length; i++) {
      const seStd = SPECIAL_ED_STANDARDS[i];
      const tStd = TEACHER_STANDARDS[i];
      for (const seItem of seStd.items) {
        for (const seSub of seItem.subItems) {
          // Check if this sub-item title exists in teacher standards
          const teacherSubs = tStd.items.flatMap(ti => ti.subItems).map(s => s.title);
          if (!teacherSubs.includes(seSub.title)) {
            hasDifference = true;
          }
        }
      }
    }
    expect(hasDifference).toBe(true);
  });

  it("all other jobs should still return standards correctly", async () => {
    const { getStandardsForJob } = await import("../client/src/lib/all-jobs-standards");
    
    const jobs = ["principal", "vice_principal", "counselor", "health_counselor", "supervisor", "librarian", "kindergarten", "admin_assistant"];
    for (const jobId of jobs) {
      const standards = getStandardsForJob(jobId);
      expect(standards).toBeDefined();
      expect(Array.isArray(standards)).toBe(true);
    }
  });

  it("special_ed standard ids should be unique", async () => {
    const { SPECIAL_ED_STANDARDS } = await import("../client/src/lib/all-jobs-standards");
    const ids = new Set<string>();
    for (const s of SPECIAL_ED_STANDARDS) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      for (const item of s.items) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
        for (const sub of item.subItems) {
          expect(ids.has(sub.id)).toBe(false);
          ids.add(sub.id);
        }
      }
    }
  });
});
