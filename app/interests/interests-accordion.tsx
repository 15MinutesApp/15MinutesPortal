"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, PowerOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Interest, SubInterest } from "./types";
import { AddInterestDialog } from "./add-interest-dialog";
import { AddSubInterestDialog } from "./add-sub-interest-dialog";

interface InterestsAccordionProps {
  data: Interest[];
  onAdd?: (interest: Interest) => void;
  onUpdate?: (interest: Interest) => void;
  onAddSubInterest?: (parentId: string, subInterest: SubInterest) => void;
  onUpdateSubInterest?: (parentId: string, subInterest: SubInterest) => void;
}

export function InterestsAccordion({
  data,
  onAdd,
  onUpdate,
  onAddSubInterest,
  onUpdateSubInterest,
}: InterestsAccordionProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(
    new Set()
  );

  const toggleRow = (interestId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(interestId)) {
        newSet.delete(interestId);
      } else {
        newSet.add(interestId);
      }
      return newSet;
    });
  };

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(
      (interest) =>
        interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interest.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interest.subInterests.some(
          (sub) =>
            sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [data, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
          <Input
            placeholder="Kategori ara..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 border-pink-500/30 focus-visible:ring-pink-500/50 focus-visible:border-pink-500/50"
          />
        </div>
        <AddInterestDialog onAdd={onAdd} />
      </div>

      <div className="bg-gradient-to-r from-pink-500/5 to-blue-400/5 rounded-xl   overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-blue-400/10 border-b border-pink-500/30">
          <div className="grid grid-cols-6 gap-4 px-6 py-4 text-sm font-semibold text-foreground">
            <div className="text-left">Durum</div>
            <div className="text-left">Kategori</div>
            <div className="text-center">Kullanıcı Sayısı</div>
            <div className="text-center">Alt Kategori Sayısı</div>
            <div className="text-center">İşlemler</div>
            <div className="text-right"></div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-pink-500/10">
          {filteredData.map((interest) => (
            <div key={interest.id}>
              {/* Main Row */}
              <div
                className="grid grid-cols-6 gap-4 px-6 py-4 bg-gradient-to-r from-pink-500/1 to-blue-400/3 hover:from-pink-500/10 hover:to-blue-400/10 hover:bg-gradient-to-r cursor-pointer transition-all duration-300"
                onClick={() => toggleRow(interest.id)}
              >
                <div className="flex items-center justify-left">
                  <Switch
                    checked={true}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-pink-500/50"
                  />
                </div>
                <div className="flex items-center gap-3">
                  {interest.thumbnail ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-pink-500/20">
                      <img
                        src={interest.thumbnail}
                        alt={interest.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          const fallback =
                            parent?.querySelector(".fallback-icon");
                          if (fallback) {
                            fallback.classList.remove("hidden");
                          }
                        }}
                      />
                      <div className="fallback-icon hidden w-full h-full bg-gradient-to-br from-pink-500/20 to-blue-400/20 flex items-center justify-center">
                        <span className="text-lg">{interest.icon}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-blue-400/20 flex items-center justify-center flex-shrink-0 ring-1 ring-pink-500/20">
                      <span className="text-lg">{interest.icon}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground text-sm">
                      {interest.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {interest.nameEn}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center items-center">
                  <span className="inline-flex items-center px-2 py-0.2 rounded-2xl text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    {interest.userCount.toLocaleString("tr-TR")}
                  </span>
                </div>

                <div className="flex justify-center items-center">
                  <span className="inline-flex items-center px-2 py-0.2 rounded-2xl text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20">
                    {interest.subInterests.length} alt kategori
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <AddInterestDialog
                    editInterest={interest}
                    onUpdate={onUpdate}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-pink-500/20 hover:text-pink-400"
                        title="Düzenle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <AddSubInterestDialog
                    parentInterest={interest}
                    onAdd={(subInterest) => {
                      if (onAddSubInterest) {
                        onAddSubInterest(interest.id, subInterest);
                      }
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-400/20 hover:text-blue-400"
                        title="Alt Kategori Ekle"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                    title="Sil"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-end">
                  <svg
                    className={`w-4 h-4 text-pink-400 transition-transform ${
                      expandedRows.has(interest.id) ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Alt Kategoriler */}
              {expandedRows.has(interest.id) && (
                <div className="">
                  {/* Alt Kategori Header */}
                  {interest.subInterests.map((subInterest, index) => (
                    <div
                      key={subInterest.id}
                      className={`grid grid-cols-6 gap-4 px-6 py-3 bg-gradient-to-r from-pink-500/0.5 to-blue-400/1 hover:from-pink-500/5 hover:to-blue-400/3 hover:bg-gradient-to-r transition-all duration-200 ${
                        index > 0
                          ? "relative before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-pink-500/40"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-left">
                        <Switch
                          checked={true}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-pink-500/50"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-blue-400/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-pink-500/20">
                          {subInterest.logo ? (
                            <img
                              src={subInterest.logo}
                              alt={subInterest.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                const fallback =
                                  parent?.querySelector(".fallback-icon");
                                if (fallback) {
                                  fallback.classList.remove("hidden");
                                }
                              }}
                            />
                          ) : null}
                          <span className="text-lg fallback-icon hidden">
                            🎮
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-sm truncate">
                            {subInterest.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {subInterest.nameEn}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-2xl text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/40">
                          {subInterest.userCount.toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <div className="flex justify-center items-center">
                  <span className="inline-flex items-center px-2 py-0.2 rounded-2xl text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20">
                     alt kategori
                  </span>
                </div>

                      <div className="flex justify-center items-center gap-2">
                        <AddSubInterestDialog
                          parentInterest={interest}
                          editSubInterest={subInterest}
                          onUpdate={(updatedSubInterest) => {
                            if (onUpdateSubInterest) {
                              onUpdateSubInterest(
                                interest.id,
                                updatedSubInterest
                              );
                            }
                          }}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-pink-500/20 hover:text-pink-400"
                              title="Düzenle"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-red-500/20 hover:text-red-400"
                          title="Sil"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>


                  
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-muted-foreground">
          Toplam {filteredData.length} kategori
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredData.reduce(
            (acc, interest) => acc + interest.subInterests.length,
            0
          )}{" "}
          alt kategori
        </div>
      </div>
    </div>
  );
}
