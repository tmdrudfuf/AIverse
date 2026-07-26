import { describe, expect, it } from "vitest";
import {
  SCHEMA_VERSION,
  RUN_STATUSES,
  STOP_REASONS,
  VALIDATION_STATUSES,
  HUMAN_GATE_STATES,
  normalizeRunStatus,
  normalizeStopReason,
  normalizeValidationStatus,
  normalizeHumanGateState,
} from "./runSummarySchema.js";

describe("runSummarySchema", () => {
  it("exposes schema version 1", () => {
    expect(SCHEMA_VERSION).toBe(1);
  });

  it("normalizes every declared run status to itself", () => {
    for (const value of Object.values(RUN_STATUSES)) {
      expect(normalizeRunStatus(value)).toBe(value);
    }
  });

  it("falls back an unrecognized run status to blocked", () => {
    expect(normalizeRunStatus("something-made-up")).toBe(RUN_STATUSES.BLOCKED);
    expect(normalizeRunStatus(undefined)).toBe(RUN_STATUSES.BLOCKED);
  });

  it("normalizes every declared stop reason to itself", () => {
    for (const value of Object.values(STOP_REASONS)) {
      expect(normalizeStopReason(value)).toBe(value);
    }
  });

  it("normalizes null/unrecognized stop reasons to null", () => {
    expect(normalizeStopReason(null)).toBeNull();
    expect(normalizeStopReason(undefined)).toBeNull();
    expect(normalizeStopReason("not-a-real-reason")).toBeNull();
  });

  it("normalizes every declared validation status to itself", () => {
    for (const value of Object.values(VALIDATION_STATUSES)) {
      expect(normalizeValidationStatus(value)).toBe(value);
    }
  });

  it("falls back an unrecognized validation status to not-run", () => {
    expect(normalizeValidationStatus("bogus")).toBe(VALIDATION_STATUSES.NOT_RUN);
  });

  it("normalizes every declared human gate state to itself", () => {
    for (const value of Object.values(HUMAN_GATE_STATES)) {
      expect(normalizeHumanGateState(value)).toBe(value);
    }
  });

  it("falls back an unrecognized human gate state to not-ready", () => {
    expect(normalizeHumanGateState("bogus")).toBe(HUMAN_GATE_STATES.NOT_READY);
  });
});
