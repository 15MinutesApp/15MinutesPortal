"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { Interest } from "../../types";

interface EditSubInterestDialogProps {
  parentInterest: Interest;
  editSubInterest: Interest;
  onUpdate: (subInterest: Interest) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSubInterestDialog({
  parentInterest,
  editSubInterest,
  onUpdate,
  open,
  onOpenChange,
}: EditSubInterestDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    thumbnail: "",
    userCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editSubInterest && open) {
      setFormData({
        name: editSubInterest.name,
        thumbnail: editSubInterest.thumbnail || "",
        userCount: editSubInterest.userCount,
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
        handleInputChange("thumbnail", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Hata",
        description: "İsim alanı zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const updatedSubInterest: Interest = {
        ...editSubInterest,
        name: formData.name.trim(),
        thumbnail: formData.thumbnail || undefined,
        userCount: formData.userCount || 0,
        isActive: editSubInterest.isActive,
        interestCategory: parentInterest,
        subInterests: [],
      };

      await onUpdate(updatedSubInterest);

      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla güncellendi.",
        variant: "default",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Alt kategori güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Alt Kategori Düzenle - {parentInterest.name}
          </DialogTitle>
          <DialogDescription>
            {parentInterest.name} kategorisindeki alt kategoriyi düzenleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">İsim</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="League of Legends, Futbol..."
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
              {formData.thumbnail && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-pink-500/20">
                  <img
                    src={formData.thumbnail}
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
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Güncelleniyor..." : "Alt Kategori Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
