"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Interest } from "./types";

interface AddInterestDialogProps {
  onAdd?: (interest: Interest) => void;
  onUpdate?: (interest: Interest) => void;
  editInterest?: Interest;
  trigger?: React.ReactNode;
}

export function AddInterestDialog({
  onAdd,
  onUpdate,
  editInterest,
  trigger,
}: AddInterestDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nameTr: "",
    nameEn: "",
    thumbnail: "",
    icon: "",
    color: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (editInterest && open) {
      setFormData({
        nameTr: editInterest.name,
        nameEn: editInterest.nameEn,
        thumbnail: editInterest.thumbnail || "",
        icon: editInterest.icon,
        color: editInterest.color,
      });
    } else if (!editInterest && open) {
      setFormData({
        nameTr: "",
        nameEn: "",
        thumbnail: "",
        icon: "",
        color: "",
      });
    }
  }, [editInterest, open]);

  const resetForm = () => {
    if (!editInterest) {
      setFormData({
        nameTr: "",
        nameEn: "",
        thumbnail: "",
        icon: "",
        color: "",
      });
    }
  };

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
    if (!formData.nameTr || !formData.nameEn) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simüle edilmiş API çağrısı - sonra backend'e bağlanacak
    setTimeout(() => {
      console.log("Form Data:", formData);

      if (editInterest) {
        // Update mode
        const updatedInterest: Interest = {
          ...editInterest,
          name: formData.nameTr,
          nameEn: formData.nameEn,
          icon: formData.icon || editInterest.icon,
          color: formData.color || editInterest.color,
          thumbnail: formData.thumbnail || undefined,
        };

        onUpdate?.(updatedInterest);

        toast({
          title: "Başarılı",
          description: `"${formData.nameTr}" kategorisi başarıyla güncellendi`,
          variant: "success",
        });
      } else {
        // Add mode
        const newInterest: Interest = {
          id: `interest-${Date.now()}`,
          name: formData.nameTr,
          nameEn: formData.nameEn,
          icon: formData.icon || "🎮",
          color: formData.color || "#ec4899",
          thumbnail: formData.thumbnail || undefined,
          userCount: 0,
          subInterests: [],
        };

        onAdd?.(newInterest);

        toast({
          title: "Başarılı",
          description: `"${formData.nameTr}" kategorisi başarıyla eklendi`,
          variant: "success",
        });
      }

      setIsLoading(false);
      setOpen(false);
      resetForm();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori Ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editInterest ? "İlgi Alanını Düzenle" : "Yeni İlgi Alanı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {editInterest
              ? "Ana kategori bilgilerini güncelleyin"
              : "Yeni bir ana kategori oluşturun"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2 ">
            <Label htmlFor="name-tr">Türkçe İsim</Label>
            <Input
              id="name-tr"
              placeholder="Oyun, Spor..."
              value={formData.nameTr}
              onChange={(e) =>
                setFormData({ ...formData, nameTr: e.target.value })
              }
              className="placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name-en">İngilizce İsim</Label>
            <Input
              id="name-en"
              placeholder="Gaming, Sports..."
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
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
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            İptal
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? "Kaydediliyor..."
              : editInterest
              ? "Güncelle"
              : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
