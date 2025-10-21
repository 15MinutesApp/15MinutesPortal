"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { Plus, Upload, CheckCircle2, XCircle } from "lucide-react";
import { SubInterest, Interest } from "./types";

interface AddSubInterestDialogProps {
  parentInterest: Interest;
  onAdd?: (subInterest: SubInterest) => void;
  onUpdate?: (subInterest: SubInterest) => void;
  editSubInterest?: SubInterest;
  trigger?: React.ReactNode;
}

export function AddSubInterestDialog({
  parentInterest,
  onAdd,
  onUpdate,
  editSubInterest,
  trigger,
}: AddSubInterestDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nameTr: "",
    nameEn: "",
    logo: "",
    userCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Edit mode için form data'yı doldur
  React.useEffect(() => {
    if (editSubInterest && open) {
      setFormData({
        nameTr: editSubInterest.name,
        nameEn: editSubInterest.nameEn,
        logo: editSubInterest.logo || "",
        userCount: editSubInterest.userCount,
      });
    } else if (!editSubInterest && open) {
      setFormData({
        nameTr: "",
        nameEn: "",
        logo: "",
        userCount: 0,
      });
    }
  }, [editSubInterest, open]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleInputChange("logo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameTr.trim() || !formData.nameEn.trim()) {
      toast({
        title: "Hata",
        description: "Türkçe ve İngilizce isim alanları zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editSubInterest) {
        // Edit mode
        const updatedSubInterest: SubInterest = {
          ...editSubInterest,
          name: formData.nameTr.trim(),
          nameEn: formData.nameEn.trim(),
          logo: formData.logo || undefined,
          userCount: formData.userCount || 0,
        };

        if (onUpdate) {
          onUpdate(updatedSubInterest);
        }

        toast({
          title: "Başarılı",
          description: "Alt kategori başarıyla güncellendi.",
          variant: "success",
        });
      } else {
        // Add mode
        const newSubInterest: SubInterest = {
          id: `sub-${Date.now()}`,
          name: formData.nameTr.trim(),
          nameEn: formData.nameEn.trim(),
          logo: formData.logo || undefined,
          userCount: formData.userCount || 0,
        };

        if (onAdd) {
          onAdd(newSubInterest);
        }

        toast({
          title: "Başarılı",
          description: "Alt kategori başarıyla eklendi.",
          variant: "success",
        });
      }

      setFormData({
        nameTr: "",
        nameEn: "",
        logo: "",
        userCount: 0,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Alt kategori eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    if (!editSubInterest) {
      setFormData({
        nameTr: "",
        nameEn: "",
        logo: "",
        userCount: 0,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <div onClick={(e) => e.stopPropagation()}>{trigger}</div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-pink-500/10 to-blue-400/10 border-pink-500/30 hover:from-pink-500/20 hover:to-blue-400/20"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Alt Kategori Ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editSubInterest ? "Alt Kategori Düzenle" : "Alt Kategori Ekle"} -{" "}
            {parentInterest.name}
          </DialogTitle>
          <DialogDescription>
            {editSubInterest
              ? `${parentInterest.name} kategorisindeki alt kategoriyi düzenleyin`
              : `${parentInterest.name} kategorisi için yeni bir alt kategori oluşturun`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nameTr">Türkçe İsim</Label>
            <Input
              id="nameTr"
              value={formData.nameTr}
              onChange={(e) => handleInputChange("nameTr", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="League of Legends, Futbol..."
              className="placeholder:text-muted-foreground/40"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nameEn">İngilizce İsim</Label>
            <Input
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) => handleInputChange("nameEn", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="League of Legends, Soccer..."
              className="placeholder:text-muted-foreground/40"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="w-full bg-[#FFCDE1] hover:bg-[#CDFBFF] text-[#1C1C1C] hover:text-[#1C1C1C] cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2 text-[#1C1C1C] hover:text-[#1C1C1C]" />
                  Thumbnail Yükle
                </Button>
              </div>
              {formData.logo && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-pink-500/20">
                  <img
                    src={formData.logo}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                resetForm();
                setOpen(false);
              }}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? editSubInterest
                  ? "Güncelleniyor..."
                  : "Ekleniyor..."
                : editSubInterest
                ? "Alt Kategori Güncelle"
                : "Alt Kategori Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
