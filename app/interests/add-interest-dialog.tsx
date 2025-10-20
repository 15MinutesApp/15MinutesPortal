"use client";

import { useState } from "react";
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
import { Plus, Upload } from "lucide-react";

export function AddInterestDialog() {
  const [open, setOpen] = useState(false);
  const [isSubCategory, setIsSubCategory] = useState(false);
  const [formData, setFormData] = useState({
    nameTr: "",
    nameEn: "",
    thumbnail: "",
    icon: "",
    color: "",
    parentCategoryId: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  // Mock categories - sonra backenden gelecek
  const categories = [
    { id: "gaming", name: "Oyunlar" },
    { id: "music", name: "Müzik" },
    { id: "sports", name: "Spor" },
  ];

  const resetForm = () => {
    setFormData({
      nameTr: "",
      nameEn: "",
      thumbnail: "",
      icon: "",
      color: "",
      parentCategoryId: "",
    });
    setIsSubCategory(false);
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

    if (isSubCategory && !formData.parentCategoryId) {
      toast({
        title: "Hata",
        description: "Lütfen ana kategori seçin",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simüle edilmiş API çağrısı - sonra backend'e bağlanacak
    setTimeout(() => {
      console.log("Form Data:", {
        isSubCategory,
        ...formData,
      });

      toast({
        title: "Başarılı",
        description: isSubCategory
          ? "Alt kategori oluşturuldu (Mock)"
          : "Ana kategori oluşturuldu (Mock)",
      });

      setIsLoading(false);
      setOpen(false);
      resetForm();
    }, 1000);
  };

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
            <Label className="text-sm font-medium">Kategori Türü</Label>
            <div className="inline-flex rounded-lg border border-pink-500/30 bg-muted p-1">
              <Button
                type="button"
                variant={!isSubCategory ? "default" : "ghost"}
                className={`flex-1 ${
                  !isSubCategory
                    ? "bg-gradient-to-r from-pink-500 to-blue-400 text-white hover:from-pink-600 hover:to-blue-500"
                    : "hover:bg-transparent"
                }`}
                onClick={() => setIsSubCategory(false)}
              >
                Ana Kategori
              </Button>
              <Button
                type="button"
                variant={isSubCategory ? "default" : "ghost"}
                className={`flex-1 ${
                  isSubCategory
                    ? "bg-gradient-to-r from-pink-500 to-blue-400 text-white hover:from-pink-600 hover:to-blue-500"
                    : "hover:bg-transparent"
                }`}
                onClick={() => setIsSubCategory(true)}
              >
                Alt Kategori
              </Button>
            </div>
          </div>

          {isSubCategory && (
            <div className="grid gap-2">
              <Label htmlFor="parent">Ana Kategori</Label>
              <Select
                value={formData.parentCategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ana kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name-tr">Türkçe İsim</Label>
            <Input
              id="name-tr"
              placeholder="Örn: Oyun, Spor..."
              value={formData.nameTr}
              onChange={(e) =>
                setFormData({ ...formData, nameTr: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name-en">İngilizce İsim</Label>
            <Input
              id="name-en"
              placeholder="Örn: Gaming, Sports..."
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logo">Thumbnail URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo"
                placeholder="https://example.com/logo.png"
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail: e.target.value })
                }
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isSubCategory && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="icon">İkon (Emoji)</Label>
                <Input
                  id="icon"
                  placeholder="🕹️"
                  maxLength={2}
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Renk</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, color: value })
                  }
                >
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
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
