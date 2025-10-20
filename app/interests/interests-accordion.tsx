"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Plus, Pencil, Trash2, PowerOff } from "lucide-react";
import { Interest, SubInterest } from "./types";
import { AddInterestDialog } from "./add-interest-dialog";

interface InterestsAccordionProps {
  data: Interest[];
}

export function InterestsAccordion({ data }: InterestsAccordionProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

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

  const renderSubInterestItem = (subInterest: SubInterest) => (
    <div
      key={subInterest.id}
      className="group relative flex items-center gap-3 p-4 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-blue-400/5 hover:from-pink-500/10 hover:to-blue-400/10 hover:border-pink-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10"
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-blue-400/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-pink-500/20">
        {subInterest.logo ? (
          <img
            src={subInterest.logo}
            alt={subInterest.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              const fallback = parent?.querySelector(".fallback-icon");
              if (fallback) {
                fallback.classList.remove("hidden");
              }
            }}
          />
        ) : null}
        <span className="text-2xl fallback-icon hidden">🎮</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground text-sm truncate">
          {subInterest.name}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {subInterest.userCount.toLocaleString("tr-TR")} kullanıcı
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-pink-500/20 hover:text-pink-400"
          title="Düzenle"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-red-500/20 hover:text-red-400"
          title="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

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
        <AddInterestDialog />
      </div>

      <div className="space-y-2">
        <Accordion type="multiple" className="w-full">
          {filteredData.map((interest) => (
            <AccordionItem
              key={interest.id}
              value={interest.id}
              className="border border-pink-500/30 rounded-xl mb-3 bg-gradient-to-r from-pink-500/5 to-blue-400/5 hover:from-pink-500/10 hover:to-blue-400/10 transition-all duration-300"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline group">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="font-bold text-foreground text-base">
                        {interest.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {interest.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-semibold bg-pink-500/10 text-pink-400 border-pink-500/20"
                    >
                      {interest.userCount.toLocaleString("tr-TR")} kullanıcı
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-blue-400/30 text-blue-400"
                    >
                      {interest.subInterests.length} alt kategori
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-pink-500/20 hover:text-pink-400"
                        title="Düzenle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-400/20 hover:text-blue-400"
                        title="Alt Kategori Ekle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-yellow-400/20 hover:text-yellow-400"
                        title="Pasif Yap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PowerOff className="h-4 w-4" />
                      </Button>
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
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {interest.subInterests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {interest.subInterests.map(renderSubInterestItem)}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Alt kategori bulunmuyor
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
