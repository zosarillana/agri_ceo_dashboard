"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, AlertCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { productsService } from "@/services/products.service";
import { useProductsStore } from "@/store/products.store";
import { CreateProductDTO } from "@/types/products.types";

const UNIT_OPTIONS = ["kg", "g", "L", "ml", "mT", "pcs", "bags", "boxes"] as const;

interface ProductDraft {
  localId: string;
  name: string;
  unit: string;
  defaultTarget: string;
}

// Build-safe UUID generator
function generateUUID(): string {
  // Check for browser environment with crypto support
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  
  // Fallback for build time / older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function newDraft(): ProductDraft {
  return { localId: generateUUID(), name: "", unit: "", defaultTarget: "" };
}

interface ProductInputFormProps {
  onSave?: () => void;
}

export default function ProductInputForm({ onSave }: ProductInputFormProps) {
  const [drafts, setDrafts]       = useState<ProductDraft[]>([newDraft()]);
  const [status, setStatus]       = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving]       = useState(false);

  const { fetchProducts } = useProductsStore();

  function handleChange(localId: string, field: keyof ProductDraft, value: string) {
    setDrafts((prev) =>
      prev.map((d) => (d.localId === localId ? { ...d, [field]: value } : d))
    );
    setStatus("idle");
  }

  function addRow() {
    setDrafts((prev) => [...prev, newDraft()]);
    setStatus("idle");
  }

  function removeRow(localId: string) {
    setDrafts((prev) => prev.filter((d) => d.localId !== localId));
    setStatus("idle");
  }

  function handleReset() {
    setDrafts([newDraft()]);
    setStatus("idle");
    setStatusMsg("");
  }

  async function handleSubmit() {
    const incomplete = drafts.some(
      (d) => d.name.trim() === "" || d.unit.trim() === ""
    );
    if (incomplete) {
      setStatus("error");
      setStatusMsg("All products must have a name and unit before saving.");
      return;
    }

    const payload: CreateProductDTO[] = drafts.map((d) => ({
      name:           d.name.trim(),
      unit:           d.unit.trim(),
      default_target: parseFloat(d.defaultTarget) || 0,
    }));

    setSaving(true);
    setStatus("idle");

    try {
      await Promise.all(payload.map((p) => productsService.create(p)));
      await fetchProducts();
      setStatus("success");
      setStatusMsg(`${payload.length} product${payload.length !== 1 ? "s" : ""} saved.`);
      setDrafts([newDraft()]);
      onSave?.();
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(err?.response?.data?.message ?? "Failed to save products. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Product Input</CardTitle>
          <CardDescription>
            Add or update product definitions used across production tracking
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {drafts.map((d, idx) => (
          <Card key={d.localId}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">Product {idx + 1}</p>
                {drafts.length > 1 && (
                  <button
                    onClick={() => removeRow(d.localId)}
                    disabled={saving}
                    className="text-muted-foreground hover:text-rose-600 transition-colors disabled:opacity-50"
                    aria-label="Remove product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Name */}
                <div className="space-y-1">
                  <Label htmlFor={`${d.localId}-name`} className="text-xs text-muted-foreground">
                    Product name
                  </Label>
                  <Input
                    id={`${d.localId}-name`}
                    type="text"
                    placeholder="e.g. Coconut Water"
                    value={d.name}
                    disabled={saving}
                    onChange={(e) => handleChange(d.localId, "name", e.target.value)}
                  />
                </div>

                {/* Unit */}
                <div className="space-y-1">
                  <Label htmlFor={`${d.localId}-unit`} className="text-xs text-muted-foreground">
                    Unit
                  </Label>
                  <Select
                    value={d.unit}
                    disabled={saving}
                    onValueChange={(val) => handleChange(d.localId, "unit", val)}
                  >
                    <SelectTrigger id={`${d.localId}-unit`}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default target */}
                <div className="space-y-1">
                  <Label htmlFor={`${d.localId}-target`} className="text-xs text-muted-foreground">
                    Default target / day
                  </Label>
                  <Input
                    id={`${d.localId}-target`}
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={d.defaultTarget}
                    disabled={saving}
                    onChange={(e) => handleChange(d.localId, "defaultTarget", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <button
        onClick={addRow}
        disabled={saving}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add another product
      </button>

      <div className="flex flex-col gap-3">
        {status !== "idle" && (
          <div
            className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
              status === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {status === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {statusMsg}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>Reset</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
              : "Save products"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}