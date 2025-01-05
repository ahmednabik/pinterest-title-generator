"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Badge } from "@/components/ui/badge";

export type Keyword = {
  annotation: string;
  volume: number;
  relevancy_score: number;
  normalized_annotation: string;
};

export const columns: ColumnDef<Keyword>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "annotation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Keyword" />
    ),
  },
  {
    accessorKey: "volume",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Volume" />
    ),
    cell: ({ row }) => {
      const volume = (row.getValue("volume") as number) || 0;
      return <div className="font-medium">{volume.toLocaleString()}</div>;
    },
    filterFn: (row, id, value: string[]) => {
      const volume = row.getValue(id) as number;
      return value.some((range) => {
        switch (range) {
          case "lt10":
            return volume < 10;
          case "10-100":
            return volume >= 10 && volume < 100;
          case "100-1k":
            return volume >= 100 && volume < 1000;
          case "1k-10k":
            return volume >= 1000 && volume < 10000;
          case "10k+":
            return volume >= 10000;
          default:
            return false;
        }
      });
    },
  },
  {
    accessorKey: "relevancy_score",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Relevancy" />
    ),
    cell: ({ row }) => {
      const score = row.getValue("relevancy_score") as number;
      const percentage = (score * 100).toFixed(0);
      return (
        <Badge variant={score > 0.7 ? "default" : "secondary"}>
          {percentage}
        </Badge>
      );
    },
  },
];
