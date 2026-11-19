"use client";

import * as React from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  isDateDisabled?: (date: Date) => boolean;
  disabled?: boolean;
  className?: string;
  dateFormat?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  isDateDisabled,
  disabled = false,
  className,
  dateFormat = "PPP",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    value || new Date()
  );

  React.useEffect(() => {
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const isDayDisabled = (day: Date): boolean => {
    const dayStart = startOfDay(day);

    if (minDate && isBefore(dayStart, startOfDay(minDate))) {
      return true;
    }
    if (maxDate && isBefore(startOfDay(maxDate), dayStart)) {
      return true;
    }
    if (isDateDisabled && isDateDisabled(day)) {
      return true;
    }
    return false;
  };

  const handleSelectDay = (day: Date) => {
    if (isDayDisabled(day)) return;
    onChange?.(day);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? (
            <span className="truncate">{format(value, dateFormat)}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {weekDays.map((wd) => (
              <div key={wd} className="h-7 flex items-center justify-center">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isSelected = value ? isSameDay(day, value) : false;
              const isCurrentM = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const disabledDay = isDayDisabled(day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  disabled={disabledDay}
                  className={cn(
                    "h-8 w-8 rounded-md text-xs font-normal transition-colors flex items-center justify-center",
                    !isCurrentM && "text-muted-foreground/40",
                    isCurrentM && !isSelected && "text-foreground hover:bg-accent",
                    isCurrentDay && !isSelected && "border border-primary font-semibold text-primary",
                    isSelected && "bg-primary text-primary-foreground font-semibold",
                    disabledDay && "opacity-30 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t pt-2 text-xs">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const today = new Date();
                if (!isDayDisabled(today)) {
                  onChange?.(today);
                  setCurrentMonth(today);
                  setOpen(false);
                }
              }}
            >
              Today
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  onChange?.(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
