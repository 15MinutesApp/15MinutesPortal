"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  PowerOff,
} from "lucide-react";
import { Interest } from "./types";

export const columns: ColumnDef<Interest>[] = [
  {
    accessorKey: "name",
    header: "Kategori",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">
            {row.original.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.nameEn}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "userCount",
    header: "Kullanıcı Sayısı",
    cell: ({ row }) => {
      return (
        <Badge variant="secondary" className="font-medium">
          {row.original.userCount.toLocaleString("tr-TR")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subInterests",
    header: "Alt Kategori Sayısı",
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {row.original.subInterests.length} alt kategori
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => {
      const interest = row.original;

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Düzenle"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Alt Kategori Ekle"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Pasif Yap"
          >
            <PowerOff className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={row.getToggleExpandedHandler()}
          className="p-0 h-6 w-6"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ) : null;
    },
  },
];
