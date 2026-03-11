import { describe, it, expect, vi } from "vitest";
import * as dataAccess from "../src/lib/dataAccess";
import { processPendingRequests } from "../src/lib/schedulerService";

describe("scheduler post-triage workflow", () => {
  it("updates status within 500ms and logs scheduled fields", async () => {
    const now = Date.now();
    const pending = [
      {
        id: "req1",
        fields: { Status: "Pending", Symptoms: "fever", Patient: ["p1"], Specialty: "", Appointment: [] }
      }
    ] as any[];
    vi.spyOn(dataAccess, "getPendingRequestsBatch").mockResolvedValue(pending as any);
    vi.spyOn(dataAccess, "createTriageResult").mockResolvedValue("tri1");
    vi.spyOn(dataAccess, "createAppointment").mockImplementation(async () => {
      return "app1";
    });
    const updateSpy = vi.spyOn(dataAccess, "updateRequestScheduledAtomic").mockImplementation(async (_reqId, _triId, _appId, scheduledAtIso) => {
      const diff = Math.abs(Date.parse(scheduledAtIso) - now);
      expect(diff).toBeLessThanOrEqual(500);
      return true;
    });
    const res = await processPendingRequests();
    expect(res.length).toBe(1);
    expect(updateSpy).toHaveBeenCalled();
  });

  it("excludes already scheduled requests from triage", async () => {
    const pending = [
      { id: "req1", fields: { Status: "Pending", Symptoms: "fever", Patient: ["p1"], Appointment: [] } },
      { id: "req2", fields: { Status: "Scheduled", Symptoms: "cough", Patient: ["p2"], Appointment: ["appX"] } }
    ] as any[];
    vi.spyOn(dataAccess, "getPendingRequestsBatch").mockResolvedValue(pending as any);
    const triSpy = vi.spyOn(dataAccess, "createTriageResult").mockResolvedValue("triX");
    const res = await processPendingRequests();
    expect(res.length).toBe(1);
    expect(triSpy).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate appointment for same request via atomic update and rollback", async () => {
    const pending = [
      { id: "req1", fields: { Status: "Pending", Symptoms: "fever", Patient: ["p1"], Appointment: [] } }
    ] as any[];
    vi.spyOn(dataAccess, "getPendingRequestsBatch").mockResolvedValue(pending as any);
    vi.spyOn(dataAccess, "createTriageResult").mockResolvedValue("tri1");
    vi.spyOn(dataAccess, "createAppointment").mockResolvedValue("app1");
    const destroyAppointmentSpy = vi.spyOn(dataAccess, "destroyAppointment").mockResolvedValue();
    const destroyTriageSpy = vi.spyOn(dataAccess, "destroyTriageResult").mockResolvedValue();
    vi.spyOn(dataAccess, "updateRequestScheduledAtomic").mockResolvedValue(false);
    const res = await processPendingRequests();
    expect(res.length).toBe(0);
    expect(destroyAppointmentSpy).toHaveBeenCalledWith("app1");
    expect(destroyTriageSpy).toHaveBeenCalledWith("tri1");
  });
});
