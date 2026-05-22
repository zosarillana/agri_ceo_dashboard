"use client";

import { useState, useEffect } from "react";
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
import { CheckCircle, AlertCircle, Plus, Trash2, Loader2, Pencil, X } from "lucide-react";
import { productsService } from "@/services/products.service";
import { useProductsStore } from "@/store/products.store";
import { CreateProductDTO, Product } from "@/types/products.types";

const UNIT_OPTIONS = ["kg", "g", "L", "ml", "mT", "pcs", "bags", "boxes"] as const;

/* ── types ───────────────────────────────────────────────────────────────────── */

interface ProductDraft {
  localId: string;
  name: string;
  unit: string;
  defaultTarget: string;
}

interface EditDraft {
  name: string;
  unit: string;
  defaultTarget: string;
}

/* ── helpers ─────────────────────────────────────────────────────────────────── */

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function newDraft(): ProductDraft {
  return { localId: generateUUID(), name: "", unit: "", defaultTarget: "" };
}

/* ── edit row ────────────────────────────────────────────────────────────────── */

function EditRow({
  product,
  onCancel,
  onSaved,
}: {
  product: Product;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<EditDraft>({
    name: product.name,
    unit: product.unit,
    defaultTarget: String(product.default_target ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { fetchProducts } = useProductsStore();

  function handleChange(field: keyof EditDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSave() {
    if (!draft.name.trim() || !draft.unit.trim()) {
      setError("Name and unit are required.");
      return;
    }
    setSaving(true);
    try {
      await productsService.update(product.id, {
        name: draft.name.trim(),
        unit: draft.unit.trim(),
        default_target: parseFloat(draft.defaultTarget) || 0,
      });
      await fetchProducts();
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to update product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-primary/50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-primary">Editing: {product.name}</p>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Cancel edit"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Product name</Label>
            <Input
              type="text"
              value={draft.name}
              disabled={saving}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Unit</Label>
            <Select
              value={draft.unit}
              disabled={saving}
              onValueChange={(val) => handleChange("unit", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Default target / day</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={draft.defaultTarget}
              disabled={saving}
              onChange={(e) => handleChange("defaultTarget", e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-3 rounded-md px-3 py-2 text-sm bg-rose-500/10 text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
              : "Save changes"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── existing products list ──────────────────────────────────────────────────── */

function ExistingProducts() {
  const { products, fetchProducts } = useProductsStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await productsService.remove(id);
      await fetchProducts();
    } finally {
      setDeletingId(null);
    }
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0.5">
        Existing products
      </p>

      {products.map((product) =>
        editingId === product.id ? (
          <EditRow
            key={product.id}
            product={product}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
        ) : (
          <Card key={product.id}>
            <CardContent className="py-3 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.unit}
                      {product.default_target
                        ? ` · target: ${product.default_target}/day`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(product.id)}
                    disabled={deletingId === product.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Edit product"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    aria-label="Delete product"
                  >
                    {deletingId === product.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

/* ── main form ───────────────────────────────────────────────────────────────── */

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
    <div className="space-y-6">
      {/* Existing products with edit/delete */}
      <ExistingProducts />

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Add New Products</CardTitle>
            <CardDescription>
              Add new product definitions used across production tracking
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
    </div>
  );
}