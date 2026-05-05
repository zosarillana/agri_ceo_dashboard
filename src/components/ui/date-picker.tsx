"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DatePickerInline() {
  const [date, setDate] = React.useState<Date>(new Date());

  return (
    <div className="flex items-center gap-2 mt-1">
      {/* Date text */}
      <p className="text-sm text-muted-foreground">
        {format(date, "PPP")}
      </p>

      {/* Calendar trigger */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}