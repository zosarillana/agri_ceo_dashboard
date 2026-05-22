"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

import type { Plant, MaintenanceLog } from "@/types/maintenance.types";

type Props = {
  plants: Plant[];
  openPlants: Set<number>;
  togglePlant: (id: number) => void;

  refresh: () => void;
  handleNewLog: (log: MaintenanceLog) => void;

  UnitCard: React.ComponentType<any>;
  LogInput: React.ComponentType<any>;

  statusBadge: (status: any) => React.ReactNode;
  formatDate: (date: string | null) => string;

  ArrowRight: React.ComponentType<any>;
  Activity: React.ComponentType<any>;
};

export default function MaintenanceForm({
  plants,
  openPlants,
  togglePlant,
  refresh,
  handleNewLog,
  UnitCard,
  Activity,
}: Props) {
  const [openUnits, setOpenUnits] = React.useState<Set<number>>(new Set());

  const toggleUnit = (id: number) => {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {plants?.map((plant, index) => {
          const isPlantOpen = openPlants.has(plant.id);

          return (
            <motion.div
              key={plant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                {/* PLANT HEADER */}
                <button
                  className="w-full flex justify-between items-center p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => togglePlant(plant.id)}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{plant.name}</span>
                  </div>
                </button>

                {/* PLANT BODY */}
                <AnimatePresence>
                  {isPlantOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {plant.units?.map((unit) => {
                          const isUnitOpen = openUnits.has(unit.id);

                          return (
                            <motion.div
                              key={unit.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              {/* UNIT HEADER */}
                              <button
                                className="w-full flex items-center justify-between p-3 hover:bg-muted/40"
                                onClick={() => toggleUnit(unit.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {unit.name}
                                  </span>
                                </div>
                              </button>

                              {/* UNIT BODY - ONLY UnitCard, NO DUPLICATE SUBUNITS */}
                              <AnimatePresence>
                                {isUnitOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-3">
                                      <UnitCard
                                        unit={unit}
                                        onRefresh={refresh}
                                        onLogSubmit={handleNewLog}
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}