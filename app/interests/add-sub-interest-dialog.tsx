"use client";

import { useState, useRef } from "react";
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
  trigger?: React.ReactNode;
}

export function AddSubInterestDialog({
  parentInterest,
  onAdd,
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
      });

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
    setFormData({
      nameTr: "",
      nameEn: "",
      logo: "",
      userCount: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-pink-500/10 to-blue-400/10 border-pink-500/30 hover:from-pink-500/20 hover:to-blue-400/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Alt Kategori Ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-pink-500/5 to-blue-400/5 border-pink-500/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Alt Kategori Ekle - {parentInterest.name}
          </DialogTitle>
          <DialogDescription>
            {parentInterest.name} kategorisi için yeni bir alt kategori
            oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nameTr" className="text-foreground">
              Türkçe İsim *
            </Label>
            <Input
              id="nameTr"
              value={formData.nameTr}
              onChange={(e) => handleInputChange("nameTr", e.target.value)}
              placeholder="Alt kategori Türkçe ismi"
              className="border-pink-500/30 focus-visible:ring-pink-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn" className="text-foreground">
              İngilizce İsim *
            </Label>
            <Input
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) => handleInputChange("nameEn", e.target.value)}
              placeholder="Alt kategori İngilizce ismi"
              className="border-pink-500/30 focus-visible:ring-pink-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userCount" className="text-foreground">
              Kullanıcı Sayısı
            </Label>
            <Input
              id="userCount"
              type="number"
              value={formData.userCount}
              onChange={(e) =>
                handleInputChange("userCount", parseInt(e.target.value) || 0)
              }
              placeholder="0"
              className="border-pink-500/30 focus-visible:ring-pink-500/50"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Logo/Thumbnail</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-pink-500/30 hover:bg-pink-500/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Logo Yükle
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="border-pink-500/30 hover:bg-pink-500/10"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-500 to-blue-400 hover:from-pink-600 hover:to-blue-500 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ekleniyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Alt Kategori Ekle
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
