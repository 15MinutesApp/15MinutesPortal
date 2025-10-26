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

interface EditInterestDialogProps {
  editInterest?: Interest;
  onUpdate: (interest: Interest) => void;
  interestCategories?: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInterestDialog({
  editInterest,
  onUpdate,
  interestCategories = [],
  open,
  onOpenChange,
}: EditInterestDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    thumbnail: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (editInterest && open) {
      setFormData({
        name: editInterest.name,
        thumbnail: editInterest.thumbnail || "",
      });
    }
  }, [editInterest, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, thumbnail: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!formData.name || !editInterest) {
      toast({
        title: "Hata",
        description: "Lütfen kategori adını girin",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const updatedInterest: Interest = {
        ...editInterest,
        name: formData.name,
        thumbnail: formData.thumbnail || undefined,
        isActive: editInterest.isActive,
        interestCategory: editInterest.interestCategory,
        subInterests: editInterest.subInterests || [],
      };

      await onUpdate(updatedInterest);

      toast({
        title: "Başarılı",
        description: `"${formData.name}" kategorisi başarıyla güncellendi`,
        variant: "default",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
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
          <DialogTitle>İlgi Alanını Düzenle</DialogTitle>
          <DialogDescription>
            Ana kategori bilgilerini güncelleyin
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Kategori Adı</Label>
            <Input
              id="name"
              placeholder="Spor, Oyun, Müzik..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Thumbnail</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
