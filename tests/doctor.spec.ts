import { describe, it, expect, vi } from "vitest";
import * as dataAccess from "../src/lib/dataAccess";

describe("doctor selection", () => {
  it("picks doctor with lowest load", async () => {
    vi.spyOn(dataAccess, "listActiveDoctorsBySpecialty").mockResolvedValue([
      { id: "d1", fields: {} } as any,
      { id: "d2", fields: {} } as any,
    ]);
    const loadSpy = vi.spyOn(dataAccess, "computeDoctorLoad");
    loadSpy.mockImplementation(async (id: string) => (id === "d1" ? 5 : 2));
    const id = await dataAccess.pickDoctorByLoad("Cardiology");
    expect(id).toBe("d2");
  });
});
