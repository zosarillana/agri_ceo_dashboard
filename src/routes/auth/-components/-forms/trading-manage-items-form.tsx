// src/routes/auth/-components/-forms/trading-manage-items-form.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Pencil, Trash2, Plus, X, Loader2, Save,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useTradeItemsStore } from "@/store/trade-items.store";
import { TradeItem, Market } from "@/types/trading.types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TradeItemForm {
  name: string;
  code: string;
  input: string;
  output: string;
  market: Market | "";
}

const emptyForm: TradeItemForm = {
  name: "",
  code: "",
  input: "",
  output: "",
  market: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMarketBadge(market: Market) {
  if (market === "Local") return <Badge variant="outline">Local</Badge>;
  if (market === "CWC") return (
    <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">CWC</Badge>
  );
  return <Badge variant="default">Export</Badge>;
}

// ── Trade Item Modal ──────────────────────────────────────────────────────────

interface TradeItemModalProps {
  open: boolean;
  editItem: TradeItem | null;
  onClose: () => void;
  onSaved: () => void;
}

function TradeItemModal({ open, editItem, onClose, onSaved }: TradeItemModalProps) {
  const { createTradeItem, updateTradeItem, saving, error, clearError } = useTradeItemsStore();
  const [form, setForm] = useState<TradeItemForm>(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          name:   editItem.name,
          code:   editItem.code,
          input:  editItem.input  ?? "",
          output: editItem.output ?? "",
          market: (editItem.market as Market) ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setFormError("");
      clearError();
    }
  }, [editItem, open, clearError]);

  function set(field: keyof TradeItemForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.code.trim()) { setFormError("Code is required."); return; }
    setFormError("");

    // IMPORTANT: Convert empty strings to null for the API
    const payload = {
      name:   form.name.trim(),
      code:   form.code.trim().toUpperCase(),
      input:  form.input.trim() === "" ? null : form.input.trim(),
      output: form.output.trim() === "" ? null : form.output.trim(),
      market: form.market === "" ? null : form.market,
    };

    console.log("📤 Submitting payload:", payload);

    try {
      if (editItem) {
        console.log("✏️ Updating item:", editItem.id);
        await updateTradeItem(editItem.id, payload);
      } else {
        console.log("➕ Creating new item");
        await createTradeItem(payload);
      }
      console.log("✅ Success!");
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ Error saving trade item:", err);
      // error shown from store
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Trade Item" : "New Trade Item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {(formError || error) && (
            <div className="px-3 py-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {formError || error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Name <span className="text-rose-500">*</span></label>
            <Input
              placeholder="e.g. FMS tolling — Cake → VCO"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Code <span className="text-rose-500">*</span></label>
            <Input
              placeholder="e.g. FMS-CAKE-VCO"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Unique identifier, auto-uppercased.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Input material</label>
              <Input
                placeholder="e.g. Cake"
                value={form.input}
                onChange={(e) => set("input", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Output material</label>
              <Input
                placeholder="e.g. VCO"
                value={form.output}
                onChange={(e) => set("output", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Default market</label>
            <Select value={form.market} onValueChange={(v) => set("market", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select market…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Export">Export</SelectItem>
                <SelectItem value="Local">Local</SelectItem>
                {/* <SelectItem value="CWC">CWC</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
              : <Save className="h-4 w-4 mr-1" />}
            {saving ? "Saving…" : editItem ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  item: TradeItem | null;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}

function DeleteModal({ item, onClose, onConfirm, saving }: DeleteModalProps) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Trade Item</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{item?.name}</span>?
          This will also delete all trades linked to it.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
            {saving ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Manage Component ─────────────────────────────────────────────────────

interface TradingManageItemsFormProps {
  onItemsChanged?: () => void;
}

export default function TradingManageItemsForm({ onItemsChanged }: TradingManageItemsFormProps) {
  const { tradeItems, loading, saving, fetchTradeItems, deleteTradeItem } = useTradeItemsStore();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<TradeItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<TradeItem | null>(null);

  function openCreate() { setEditItem(null); setModalOpen(true); }
  function openEdit(item: TradeItem) { setEditItem(item); setModalOpen(true); }
  
  async function confirmDelete() {
    if (!deleteItem) return;
    await deleteTradeItem(deleteItem.id);
    setDeleteItem(null);
    onItemsChanged?.();
  }

  function handleSaved() {
    fetchTradeItems();
    onItemsChanged?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Trade Items</h2>
          <p className="text-xs text-muted-foreground">{tradeItems.length} items configured</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Item
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading trade items…
            </div>
          ) : tradeItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No trade items yet.{" "}
              <button onClick={openCreate} className="text-primary underline">
                Create one
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Input</TableHead>
                  <TableHead className="font-semibold">Output</TableHead>
                  <TableHead className="font-semibold">Market</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tradeItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {item.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.input ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.output ?? "—"}</TableCell>
                    <TableCell>
                      {item.market ? getMarketBadge(item.market as Market) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TradeItemModal
        open={modalOpen}
        editItem={editItem}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <DeleteModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        saving={saving}
      />
    </div>
  );
}