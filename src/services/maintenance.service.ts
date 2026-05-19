// src/services/maintenance.service.ts
import api from "@/lib/api";
import {
  Plant,
  MaintenanceUnit,
  MaintenanceLog,
  CreateUnitPayload,
  UpdateUnitPayload,
  SubmitCheckPayload,
  PlantStatusSummary,
  DailyCompletionSummary,
  TodaysChecks,
  UncheckedUnit,
  Paginated,
} from "@/types/maintenance.types";

// ─── Plants ───────────────────────────────────────────────────────────────────

const plantService = {
  /**
   * GET /api/maintenance
   * All active plants with their top-level units and nested sub-units.
   * Primary feed for the maintenance dashboard.
   */
  async getAll(): Promise<Plant[]> {
    const res = await api.get("/api/maintenance");
    return res.data.data;
  },

  /**
   * GET /api/maintenance/plants/:id
   * Single plant with its units.
   */
  async getById(plantId: number): Promise<Plant> {
    const res = await api.get(`/api/maintenance/plants/${plantId}`);
    return res.data.data;
  },

  /**
   * GET /api/maintenance/summary
   * Status counts per plant (operational / maintenance / down / standby).
   */
  async getSummary(): Promise<PlantStatusSummary[]> {
    const res = await api.get("/api/maintenance/summary");
    return res.data.data;
  },
};

// ─── Units ────────────────────────────────────────────────────────────────────

const unitService = {
  /**
   * POST /api/maintenance/units
   * Create a top-level unit or sub-unit (pass parent_id to nest it).
   */
  async create(payload: CreateUnitPayload): Promise<MaintenanceUnit> {
    const res = await api.post("/api/maintenance/units", payload);
    return res.data.data;
  },

  /**
   * PATCH /api/maintenance/units/:id
   * Update status, notes, or scheduled dates. All fields optional.
   */
  async update(
    unitId: number,
    payload: UpdateUnitPayload,
  ): Promise<MaintenanceUnit> {
    const res = await api.patch(`/api/maintenance/units/${unitId}`, payload);
    return res.data.data;
  },

  /**
   * DELETE /api/maintenance/units/:id
   * Soft-delete a unit.
   */
  async delete(unitId: number): Promise<void> {
    await api.delete(`/api/maintenance/units/${unitId}`);
  },
};

// ─── Logs ─────────────────────────────────────────────────────────────────────

const logService = {
  /**
   * POST /api/maintenance/units/:id/check
   * Submit a daily check. Writes a log entry AND syncs the unit's status snapshot.
   */
  async submitCheck(
    unitId: number,
    payload: SubmitCheckPayload,
  ): Promise<MaintenanceLog> {
    const res = await api.post(
      `/api/maintenance/units/${unitId}/check`,
      payload,
    );
    return res.data.data;
  },

  /**
   * GET /api/maintenance/units/:id/logs
   * Paginated full history for a single unit.
   */
  async getUnitHistory(
    unitId: number,
    page = 1,
  ): Promise<Paginated<MaintenanceLog>> {
    const res = await api.get(`/api/maintenance/units/${unitId}/logs`, {
      params: { page },
    });
    return res.data;
  },

  /**
   * GET /api/maintenance/units/:id/logs/history
   * Status history over a date range — for trend charts.
   */
  async getUnitStatusHistory(
    unitId: number,
    from: string,
    to: string,
  ): Promise<MaintenanceLog[]> {
    const res = await api.get(`/api/maintenance/units/${unitId}/logs/history`, {
      params: { from, to },
    });
    return res.data.data;
  },

  /**
   * GET /api/maintenance/logs/today
   * All checks submitted today, grouped by plant.
   */
  async getToday(): Promise<TodaysChecks[]> {
    const res = await api.get("/api/maintenance/logs/today");
    return res.data.data;
  },

  /**
   * GET /api/maintenance/logs/unchecked
   * Units that have NOT been checked today.
   */
  async getUncheckedToday(): Promise<UncheckedUnit[]> {
    const res = await api.get("/api/maintenance/logs/unchecked");
    return res.data.data;
  },

  /**
   * GET /api/maintenance/logs/completion
   * Daily check completion % per plant.
   */
  async getDailyCompletion(): Promise<DailyCompletionSummary[]> {
    const res = await api.get("/api/maintenance/logs/completion");
    return res.data.data;
  },

  /**
   * GET /api/maintenance/logs/user/:userId
   * All checks submitted by a specific user, paginated.
   */
  async getUserHistory(
    userId: number,
    page = 1,
  ): Promise<Paginated<MaintenanceLog>> {
    const res = await api.get(`/api/maintenance/logs/user/${userId}`, {
      params: { page },
    });
    return res.data;
  },

  async getByDate(date: string) {
    const res = await api.get(`/api/maintenance/logs/date/${date}`);
    return res.data.data;
  },
};

// ─── Named export (mirrors production.service.ts pattern) ────────────────────

export const maintenanceService = {
  ...plantService,
  units: unitService,
  logs: logService,
};

// ─── Individual exports if preferred ─────────────────────────────────────────

export { plantService, unitService, logService };
