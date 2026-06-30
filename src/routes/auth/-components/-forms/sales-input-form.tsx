  "use client";

  import { useState, useEffect, useRef } from "react";
  import { format } from "date-fns";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Calendar } from "@/components/ui/calendar";
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover";
  import {
    CheckCircle2,
    XCircle,
    CalendarIcon,
    Lock,
    Loader2,
    Pencil,
    X,
    Trash2,
  } from "lucide-react";
  import { Market, Sale } from "@/types/sales.types";
  import { salesService } from "@/services/sales.service";

  // ─── Types ────────────────────────────────────────────────────────────────────

  interface SaleRow {
    product_id: number;
    market: Market;
    sales: number;
    quantityKg: number;
    totalSalesUSD: number;
    isReadOnly: boolean;
  }

  interface Product {
    id: number;
    name: string;
    unit?: string;
  }

  interface SalesInputFormProps {
    products: Product[];
    loading: boolean;
    onSaved: () => void;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function getTodayISO() {
    return new Date().toLocaleDateString("en-CA");
  }

  function dateToISO(d: Date) {
    return d.toLocaleDateString("en-CA");
  }

  function isoToDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function fmtUSD(n: number) {
    return (
      "$" +
      n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function formatCommitted(value: number): string {
    if (!value) return "";
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseRaw(raw: string): number {
    const cleaned = raw.replace(/,/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function emptyRows(products: Product[]): Record<number, SaleRow> {
    return Object.fromEntries(
      products.map((p) => [
        p.id,
        {
          product_id: p.id,
          market: "Export" as Market,
          sales: 0,
          quantityKg: 0,
          totalSalesUSD: 0,
          isReadOnly: false,
        },
      ]),
    );
  }

  function populateRows(
    products: Product[],
    sales: Sale[],
  ): Record<number, SaleRow> {
    const salesMap = new Map(sales.map((s) => [s.product_id, s]));
    return Object.fromEntries(
      products.map((p) => {
        const existing = salesMap.get(p.id);
        const hasData =
          existing &&
          (Number(existing.sales) > 0 || Number(existing.quantity_kg) > 0);
        return [
          p.id,
          {
            product_id: p.id,
            market: existing?.market ?? "Export",
            sales: existing ? Number(existing.sales) : 0,
            quantityKg: existing ? Number(existing.quantity_kg) : 0,
            totalSalesUSD: existing ? Number(existing.total_sales_usd) : 0,
            isReadOnly: !!hasData,
          },
        ];
      }),
    );
  }

  // ─── Skeleton ─────────────────────────────────────────────────────────────────

  function InputSkeleton({ count = 4 }: { count?: number }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ─── Banners ──────────────────────────────────────────────────────────────────

  function SuccessBanner({ message }: { message: string }) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
    );
  }

  function ErrorBanner({ message }: { message: string }) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
        <XCircle className="h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
    );
  }

  // ─── Component ────────────────────────────────────────────────────────────────

  export default function SalesInputForm({
    products,
    loading,
    onSaved,
  }: SalesInputFormProps) {
    const today = getTodayISO();

    const [dateISO, setDateISO] = useState(today);
    const [calOpen, setCalOpen] = useState(false);
    const [rows, setRows] = useState<Record<number, SaleRow>>({});
    const [fetchingRows, setFetchingRows] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAllReadOnly, setIsAllReadOnly] = useState(false);
    const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");

    const cache = useRef<Record<string, Sale[]>>({});

    const hydratedRef = useRef(false);

    useEffect(() => {
      if (hydratedRef.current) return;
      if (products.length === 0) return;

      hydratedRef.current = true;
      fetchForDate(today);
    }, [products, today]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    async function fetchForDate(iso: string) {
      if (cache.current[iso] !== undefined) {
        applyRows(products, cache.current[iso]);
        return;
      }
      setFetchingRows(true);
      try {
        const { data } = await salesService.getLatest(iso, iso);
        cache.current[iso] = data;
        applyRows(products, data);
      } catch {
        cache.current[iso] = [];
        setRows(emptyRows(products));
        setIsAllReadOnly(false);
        setUnlockedIds(new Set());
      } finally {
        setFetchingRows(false);
      }
    }

    function applyRows(prods: Product[], sales: Sale[]) {
      const populated = populateRows(prods, sales);
      setRows(populated);
      const allReadOnly = prods.every((p) => populated[p.id]?.isReadOnly);
      setIsAllReadOnly(allReadOnly);
      setUnlockedIds(new Set());
      setConfirmDeleteId(null);
      setRawInputs({});
    }

    async function handleDateChange(newISO: string) {
      setDateISO(newISO);
      setCalOpen(false);
      setStatus("idle");
      setStatusMsg("");
      setRawInputs({});
      await fetchForDate(newISO);
    }

    // ── Row helpers ───────────────────────────────────────────────────────────

    function setMarket(id: number, market: Market) {
      if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
      setRows((r) => ({ ...r, [id]: { ...r[id], market } }));
      setStatus("idle");
    }

    function handleChange(
      id: number,
      field: "sales" | "quantityKg",
      raw: string,
    ) {
      if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
      const sanitized = raw.replace(/[^0-9.,]/g, "");
      const dotCount = (sanitized.match(/\./g) || []).length;
      if (dotCount > 1) return;
      const key = `${id}-${field}`;
      setRawInputs((prev) => ({ ...prev, [key]: sanitized }));
      const numeric = parseRaw(sanitized);
      setRows((r) => {
        const updated = { ...r[id], [field]: numeric };
        updated.totalSalesUSD = updated.sales / updated.quantityKg;
        return { ...r, [id]: updated };
      });
      setStatus("idle");
    }

    function handleFocus(id: number, field: "sales" | "quantityKg") {
      if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
      const key = `${id}-${field}`;
      const numeric =
        field === "sales" ? rows[id]?.sales : rows[id]?.quantityKg;
      setRawInputs((prev) => ({
        ...prev,
        [key]: numeric ? String(numeric) : "",
      }));
    }

    function handleBlur(id: number, field: "sales" | "quantityKg") {
      const key = `${id}-${field}`;
      setRawInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    function getDisplayValue(
      id: number,
      field: "sales" | "quantityKg",
    ): string {
      const key = `${id}-${field}`;
      if (key in rawInputs) return rawInputs[key];
      const numeric =
        field === "sales" ? rows[id]?.sales : rows[id]?.quantityKg;
      return numeric ? formatCommitted(numeric) : "";
    }

    // ── Unlock / Relock ───────────────────────────────────────────────────────

    function unlockProduct(productId: number) {
      setConfirmDeleteId(null);
      setUnlockedIds((prev) => new Set(prev).add(productId));
      setRows((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], isReadOnly: false },
      }));
      setStatus("idle");
      setStatusMsg("");
    }

    function relockProduct(productId: number) {
      setConfirmDeleteId(null);
      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setRawInputs((prev) => {
        const next = { ...prev };
        delete next[`${productId}-sales`];
        delete next[`${productId}-quantityKg`];
        return next;
      });
      const cachedSales = cache.current[dateISO];
      if (cachedSales) {
        const originalSale = cachedSales.find((s) => s.product_id === productId);
        if (originalSale) {
          setRows((prev) => ({
            ...prev,
            [productId]: {
              ...prev[productId],
              market: originalSale.market,
              sales: Number(originalSale.sales),
              quantityKg: Number(originalSale.quantity_kg),
              totalSalesUSD: Number(originalSale.total_sales_usd),
              isReadOnly: true,
            },
          }));
        } else {
          setRows((prev) => ({
            ...prev,
            [productId]: {
              ...prev[productId],
              sales: 0,
              quantityKg: 0,
              totalSalesUSD: 0,
              isReadOnly: false,
            },
          }));
        }
      }
      setStatus("idle");
      setStatusMsg("");
    }

    function handleReset() {
      if (cache.current[dateISO]) {
        applyRows(products, cache.current[dateISO]);
      } else {
        setRows(emptyRows(products));
      }
      setUnlockedIds(new Set());
      setConfirmDeleteId(null);
      setRawInputs({});
      setStatus("idle");
      setStatusMsg("");
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    async function handleDelete(productId: number) {
      setIsDeleting(true);
      try {
        await salesService.delete(productId, dateISO);
        delete cache.current[dateISO];
        await fetchForDate(dateISO);
        setStatus("success");
        setStatusMsg("Sale entry deleted successfully.");
        onSaved();
      } catch (err: any) {
        setStatus("error");
        setStatusMsg(
          err?.response?.data?.message ??
            "Failed to delete entry. Please try again.",
        );
        setConfirmDeleteId(null);
      } finally {
        setIsDeleting(false);
      }
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    async function handleSave(e: React.FormEvent) {
      e.preventDefault();

      const rowsToSave = Object.values(rows).filter((r) => {
        if (unlockedIds.has(r.product_id)) return true;
        if (!r.isReadOnly && r.sales > 0 && r.quantityKg > 0) return true;
        return false;
      });

      if (rowsToSave.length === 0) {
        setStatus("error");
        setStatusMsg(
          "Please enter ASP and quantity for at least one product, or unlock a saved entry to update it.",
        );
        return;
      }

      const payload = rowsToSave.map((r) => ({
        product_id: r.product_id,
        market: r.market,
        sales: r.sales,
        quantity_kg: r.quantityKg,
      }));

      setIsSaving(true);
      try {
        await salesService.storeBulk(payload, dateISO);
        delete cache.current[dateISO];
        await fetchForDate(dateISO);
        setUnlockedIds(new Set());
        setRawInputs({});
        setStatus("success");
        setStatusMsg(
          `Sales ${rowsToSave.some((r) => rows[r.product_id]?.isReadOnly) ? "updated" : "saved"} for ${format(isoToDate(dateISO), "PPP")}.`,
        );
        onSaved();
      } catch (err: any) {
        setStatus("error");
        setStatusMsg(
          err?.response?.data?.message ??
            "Something went wrong. Please try again.",
        );
      } finally {
        setIsSaving(false);
      }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (!loading && products.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No products found. Add products in Production → Products tab.
          </CardContent>
        </Card>
      );
    }

    const isBusy = isSaving || isDeleting;
    const selectedDate = isoToDate(dateISO);
    const hasEditableRows = Object.values(rows).some((r) => !r.isReadOnly);
    const hasUnlockedRows = unlockedIds.size > 0;
    const showActionButtons =
      (hasEditableRows || hasUnlockedRows) && !fetchingRows;

    return (
      <div className="space-y-4">
        {/* ── Date picker card ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sales Entry</CardTitle>
            <CardDescription>
              Enter ASP and quantity for each product line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <Label className="text-sm whitespace-nowrap">Sale Date</Label>

              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={fetchingRows || isBusy}
                    className="w-[240px] justify-start gap-2 text-left font-normal"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && handleDateChange(dateToISO(d))}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {isAllReadOnly && !fetchingRows && unlockedIds.size === 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3 shrink-0" />
                  All sales saved — click{" "}
                  <Pencil className="h-3 w-3 inline mx-0.5" /> to update or delete
                </span>
              )}

              {unlockedIds.size > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Pencil className="h-3 w-3 shrink-0" />
                  {unlockedIds.size} product{unlockedIds.size === 1 ? "" : "s"}{" "}
                  unlocked for editing
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Status banners ── */}
        {status === "success" && <SuccessBanner message={statusMsg} />}
        {status === "error" && <ErrorBanner message={statusMsg} />}

        {/* ── Product tiles ── */}
        {loading || fetchingRows ? (
          <InputSkeleton count={products.length || 4} />
        ) : (
          <form onSubmit={handleSave} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((p) => {
                const row = rows[p.id];
                const isReadOnly = row?.isReadOnly ?? false;
                const isUnlocked = unlockedIds.has(p.id);
                const isEditable = !isReadOnly || isUnlocked;
                const isPendingDelete = confirmDeleteId === p.id;

                return (
                  <Card
                    key={p.id}
                    className={
                      isPendingDelete
                        ? "border-rose-500/50 dark:border-rose-500/30"
                        : isReadOnly && !isUnlocked
                          ? "opacity-70"
                          : isUnlocked
                            ? "border-amber-500/50 dark:border-amber-500/30"
                            : undefined
                    }
                  >
                    <CardContent className="pt-4 pb-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{p.name}</p>
                          {isUnlocked &&
                            !isPendingDelete &&
                            (isSaving ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium flex items-center gap-1">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                updating…
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                                editing
                              </span>
                            ))}
                          {isPendingDelete && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-medium">
                              deleting
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            {p.unit ?? "—"}
                          </span>

                          {/* Saved row controls */}
                          {(isReadOnly || isUnlocked) &&
                            (isUnlocked ? (
                              <div className="flex items-center gap-1">
                                {/* Relock */}
                                <button
                                  type="button"
                                  onClick={() => relockProduct(p.id)}
                                  disabled={isBusy}
                                  title="Cancel editing"
                                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                  aria-label="Cancel edit"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete with inline confirm */}
                                {isPendingDelete ? (
                                  <span className="flex items-center gap-1">
                                    <span className="text-[10px] text-rose-600 font-medium">
                                      Sure?
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(p.id)}
                                      disabled={isBusy}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white hover:bg-rose-600 font-medium transition-colors disabled:opacity-50"
                                    >
                                      {isDeleting ? "…" : "Yes"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      disabled={isBusy}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-50"
                                    >
                                      No
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(p.id)}
                                    disabled={isBusy}
                                    title="Delete sale entry"
                                    className="p-0.5 rounded text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-50"
                                    aria-label="Delete sale entry"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => unlockProduct(p.id)}
                                disabled={isBusy}
                                title="Edit sale entry"
                                className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                                aria-label="Edit sales entry"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Market toggle */}
                      <div className="flex gap-2">
                        {(["Export", "Local"] as Market[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => isEditable && setMarket(p.id, m)}
                            className="focus:outline-none"
                            disabled={!isEditable || isBusy}
                          >
                            <Badge
                              variant={
                                row?.market === m
                                  ? m === "Export"
                                    ? "default"
                                    : "secondary"
                                  : "outline"
                              }
                              className={`px-3 py-0.5 text-xs select-none transition-all ${
                                isEditable ? "cursor-pointer" : "cursor-default"
                              }`}
                            >
                              {m}
                            </Badge>
                          </button>
                        ))}
                      </div>

                      {/* ASP + Quantity */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Sales
                          </p>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                              $
                            </span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              className={`pl-5 h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                              value={getDisplayValue(p.id, "sales")}
                              readOnly={!isEditable}
                              disabled={isBusy || !isEditable}
                              onChange={(e) =>
                                handleChange(p.id, "sales", e.target.value)
                              }
                              onFocus={() => handleFocus(p.id, "sales")}
                              onBlur={() => handleBlur(p.id, "sales")}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Quantity (Kg)
                          </p>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            className={`h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                            value={getDisplayValue(p.id, "quantityKg")}
                            readOnly={!isEditable}
                            disabled={isBusy || !isEditable}
                            onChange={(e) =>
                              handleChange(p.id, "quantityKg", e.target.value)
                            }
                            onFocus={() => handleFocus(p.id, "quantityKg")}
                            onBlur={() => handleBlur(p.id, "quantityKg")}
                          />
                        </div>
                      </div>

                      {/* Auto-total */}
                      {(row?.totalSalesUSD ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                          ASP:{" "}
                          <span className="font-medium text-foreground">
                            {fmtUSD(row.totalSalesUSD)}
                          </span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Save / Reset */}
            {showActionButtons && (
              <div className="flex items-center gap-3 mt-4">
                <Button type="submit" disabled={isBusy} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : hasUnlockedRows ? (
                    `Update ${unlockedIds.size} sale${unlockedIds.size === 1 ? "" : "s"}`
                  ) : (
                    "Save Sales"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isBusy}
                >
                  Reset
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    );
  }
