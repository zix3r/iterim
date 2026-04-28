import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Search } from "lucide-react";
import type { AbsenceFilters } from "@/lib/api";

interface Props {
  filters: AbsenceFilters;
  onFilterChange: (filters: AbsenceFilters) => void;
  onClear: () => void;
}

export function AbsenceFilterBar({ filters, onFilterChange, onClear }: Props) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border mb-6">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search member name..."
          className="pl-9"
          value={filters.memberName || ""}
          onChange={(e) => onFilterChange({ ...filters, memberName: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-[160px]"
          value={filters.from || ""}
          onChange={(e) => onFilterChange({ ...filters, from: e.target.value })}
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="date"
          className="w-[160px]"
          value={filters.to || ""}
          onChange={(e) => onFilterChange({ ...filters, to: e.target.value })}
        />
      </div>

      <Select 
        value={filters.type || "all"} 
        onValueChange={(val: string) => onFilterChange({ ...filters, type: val === "all" ? undefined : val })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Sick">Sick</SelectItem>
          <SelectItem value="Vacation">Vacation</SelectItem>
          <SelectItem value="Absent">Absent</SelectItem>
          <SelectItem value="Late">Late</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-10 px-3">
          <X className="h-4 w-4 mr-2" />
          Clear ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}