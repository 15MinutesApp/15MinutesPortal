"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload } from "lucide-react";

export function AddInterestDialog() {
  const [open, setOpen] = useState(false);
  const [interestType, setInterestType] = useState<"category" | "subcategory">(
    "category"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kategori Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni İlgi Alanı Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir kategori veya alt kategori oluşturun
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tür</Label>
            <Select
              value={interestType}
              onValueChange={(value: "category" | "subcategory") =>
                setInterestType(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Ana Kategori</SelectItem>
                <SelectItem value="subcategory">Alt Kategori</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {interestType === "subcategory" && (
            <div className="grid gap-2">
              <Label htmlFor="parent">Ana Kategori</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Ana kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaming">Oyun</SelectItem>
                  <SelectItem value="music">Müzik</SelectItem>
                  <SelectItem value="sports">Spor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name-tr">Türkçe İsim</Label>
            <Input id="name-tr" placeholder="Örn: Oyun, Spor..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name-en">İngilizce İsim</Label>
            <Input id="name-en" placeholder="Örn: Gaming, Sports..." />
          </div>

          {interestType === "category" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="icon">İkon (Emoji)</Label>
                <Input id="icon" placeholder="🕹️" maxLength={2} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Renk</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Renk seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-purple-500">Mor</SelectItem>
                    <SelectItem value="bg-pink-500">Pembe</SelectItem>
                    <SelectItem value="bg-green-500">Yeşil</SelectItem>
                    <SelectItem value="bg-blue-500">Mavi</SelectItem>
                    <SelectItem value="bg-orange-500">Turuncu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {interestType === "subcategory" && (
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <div className="flex gap-2">
                <Input id="logo" placeholder="https://example.com/logo.png" />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button
            type="submit"
            onClick={() => {
              // Handle submit
              setOpen(false);
            }}
          >
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
