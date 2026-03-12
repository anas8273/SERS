import { describe, expect, it } from "vitest";
import {
  PRINCIPAL_STANDARDS,
  VICE_PRINCIPAL_STANDARDS,
  COUNSELOR_STANDARDS,
  HEALTH_COUNSELOR_STANDARDS,
  ACTIVITY_LEADER_STANDARDS,
  LAB_TECHNICIAN_STANDARDS,
  KINDERGARTEN_STANDARDS,
  SUPERVISOR_STANDARDS,
  getStandardsForJob,
} from "../client/src/lib/all-jobs-standards";
import { STANDARDS } from "../client/src/lib/standards-data";
import type { Standard } from "../client/src/lib/standards-data";

// Helper to validate standard structure
function validateStandard(standard: Standard, jobName: string) {
  expect(standard.id).toBeTruthy();
  expect(standard.title).toBeTruthy();
  expect(standard.weight).toBeGreaterThan(0);
  expect(standard.items).toBeDefined();
  expect(standard.items.length).toBeGreaterThan(0);

  standard.items.forEach((item) => {
    expect(item.id, `${jobName} item missing id`).toBeTruthy();
    expect(item.text, `${jobName} item missing text`).toBeTruthy();
    expect(item.suggestedEvidence, `${jobName} item missing suggestedEvidence`).toBeDefined();
    expect(Array.isArray(item.suggestedEvidence)).toBe(true);

    if (item.subItems && item.subItems.length > 0) {
      item.subItems.forEach((sub) => {
        expect(sub.id, `${jobName} subItem missing id`).toBeTruthy();
        expect(sub.title, `${jobName} subItem missing title`).toBeTruthy();
        expect(sub.suggestedEvidence, `${jobName} subItem missing suggestedEvidence`).toBeDefined();
      });
    }
  });
}

describe("Teacher Standards (STANDARDS)", () => {
  it("should have 11 standards", () => {
    expect(STANDARDS.length).toBe(11);
  });

  it("should have valid structure for all standards", () => {
    STANDARDS.forEach((std) => validateStandard(std, "Teacher"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Principal Standards", () => {
  it("should have correct number of standards", () => {
    expect(PRINCIPAL_STANDARDS.length).toBeGreaterThanOrEqual(19);
  });

  it("should have valid structure", () => {
    PRINCIPAL_STANDARDS.forEach((std) => validateStandard(std, "Principal"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = PRINCIPAL_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Vice Principal Standards", () => {
  it("should have correct number of standards", () => {
    expect(VICE_PRINCIPAL_STANDARDS.length).toBeGreaterThanOrEqual(19);
  });

  it("should have valid structure", () => {
    VICE_PRINCIPAL_STANDARDS.forEach((std) => validateStandard(std, "Vice Principal"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = VICE_PRINCIPAL_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Counselor Standards", () => {
  it("should have correct number of standards", () => {
    expect(COUNSELOR_STANDARDS.length).toBeGreaterThanOrEqual(13);
  });

  it("should have valid structure", () => {
    COUNSELOR_STANDARDS.forEach((std) => validateStandard(std, "Counselor"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = COUNSELOR_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Health Counselor Standards", () => {
  it("should have correct number of standards", () => {
    expect(HEALTH_COUNSELOR_STANDARDS.length).toBeGreaterThanOrEqual(14);
  });

  it("should have valid structure", () => {
    HEALTH_COUNSELOR_STANDARDS.forEach((std) => validateStandard(std, "Health Counselor"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = HEALTH_COUNSELOR_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Activity Leader Standards", () => {
  it("should have correct number of standards", () => {
    expect(ACTIVITY_LEADER_STANDARDS.length).toBeGreaterThanOrEqual(15);
  });

  it("should have valid structure", () => {
    ACTIVITY_LEADER_STANDARDS.forEach((std) => validateStandard(std, "Activity Leader"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = ACTIVITY_LEADER_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Lab Technician Standards", () => {
  it("should have correct number of standards", () => {
    expect(LAB_TECHNICIAN_STANDARDS.length).toBeGreaterThanOrEqual(13);
  });

  it("should have valid structure", () => {
    LAB_TECHNICIAN_STANDARDS.forEach((std) => validateStandard(std, "Lab Technician"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = LAB_TECHNICIAN_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Kindergarten Standards", () => {
  it("should have correct number of standards", () => {
    expect(KINDERGARTEN_STANDARDS.length).toBeGreaterThanOrEqual(19);
  });

  it("should have valid structure", () => {
    KINDERGARTEN_STANDARDS.forEach((std) => validateStandard(std, "Kindergarten"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = KINDERGARTEN_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("Supervisor Standards", () => {
  it("should have correct number of standards", () => {
    expect(SUPERVISOR_STANDARDS.length).toBeGreaterThanOrEqual(8);
  });

  it("should have valid structure", () => {
    SUPERVISOR_STANDARDS.forEach((std) => validateStandard(std, "Supervisor"));
  });

  it("should have weights summing to 100%", () => {
    const totalWeight = SUPERVISOR_STANDARDS.reduce((sum, std) => sum + std.weight, 0);
    expect(totalWeight).toBe(100);
  });
});

describe("getStandardsForJob", () => {
  it("should return correct standards for each job", () => {
    expect(getStandardsForJob("principal")).toBe(PRINCIPAL_STANDARDS);
    expect(getStandardsForJob("vice_principal")).toBe(VICE_PRINCIPAL_STANDARDS);
    expect(getStandardsForJob("counselor")).toBe(COUNSELOR_STANDARDS);
    expect(getStandardsForJob("health_counselor")).toBe(HEALTH_COUNSELOR_STANDARDS);
    expect(getStandardsForJob("activity_leader")).toBe(ACTIVITY_LEADER_STANDARDS);
    expect(getStandardsForJob("lab_technician")).toBe(LAB_TECHNICIAN_STANDARDS);
    expect(getStandardsForJob("kindergarten")).toBe(KINDERGARTEN_STANDARDS);
    expect(getStandardsForJob("supervisor")).toBe(SUPERVISOR_STANDARDS);
  });

  it("should return empty array for unknown job", () => {
    expect(getStandardsForJob("unknown")).toEqual([]);
  });
});

describe("All standards have unique IDs", () => {
  const allStandards = [
    { name: "Teacher", standards: STANDARDS },
    { name: "Principal", standards: PRINCIPAL_STANDARDS },
    { name: "Vice Principal", standards: VICE_PRINCIPAL_STANDARDS },
    { name: "Counselor", standards: COUNSELOR_STANDARDS },
    { name: "Health Counselor", standards: HEALTH_COUNSELOR_STANDARDS },
    { name: "Activity Leader", standards: ACTIVITY_LEADER_STANDARDS },
    { name: "Lab Technician", standards: LAB_TECHNICIAN_STANDARDS },
    { name: "Kindergarten", standards: KINDERGARTEN_STANDARDS },
    { name: "Supervisor", standards: SUPERVISOR_STANDARDS },
  ];

  allStandards.forEach(({ name, standards }) => {
    it(`${name} should have unique standard IDs`, () => {
      const ids = standards.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it(`${name} should have unique item IDs within each standard`, () => {
      standards.forEach((std) => {
        const ids = std.items.map((i) => i.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size, `Duplicate item IDs in ${name} standard ${std.id}`).toBe(ids.length);
      });
    });
  });
});
