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
    if (editInterest) {
      setFormData({
        nameTr: editInterest.name,
        nameEn: editInterest.nameEn,
        thumbnail: editInterest.thumbnail || "",
        icon: editInterest.icon,
        color: editInterest.color,
      });
    }
  }, [editInterest]);

  const resetForm = () => {
    setFormData({
      nameTr: "",
      nameEn: "",
      thumbnail: "",
      icon: "",
      color: "",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Dosyayı backend'e yükle ve URL al
      setFormData({ ...formData, thumbnail: file.name });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!formData.nameTr || !formData.nameEn) {
      toast({
        title: "Hata",
        description: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Lütfen tüm zorunlu alanları doldurun</span>
          </div>
        ),
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
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>"{formData.nameTr}" kategorisi başarıyla güncellendi</span>
            </div>
          ),
          className: "border-green-500/50 bg-green-500/10",
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
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>"{formData.nameTr}" kategorisi başarıyla eklendi</span>
            </div>
          ),
          className: "border-green-500/50 bg-green-500/10",
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
          <div className="grid gap-2">
            <Label htmlFor="name-tr">İsim</Label>
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
            <Label htmlFor="logo">Thumbnail URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo"
                placeholder="Thumbnail.png"
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail: e.target.value })
                }
                className="placeholder:text-muted-foreground/40"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" />
              </Button>
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
