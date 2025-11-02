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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Interest } from "../../types";

interface AddInterestDialogProps {
  onAdd?: (interest: Interest) => void;
  onUpdate?: (interest: Interest) => void;
  editInterest?: Interest;
  trigger?: React.ReactNode;
  interestCategories?: Array<{ id: string; name: string }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddInterestDialog({
  onAdd,
  onUpdate,
  editInterest,
  trigger,
  interestCategories = [],
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: AddInterestDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen =
    externalOnOpenChange || ((value: boolean) => setInternalOpen(value));
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
    } else if (!editInterest && open) {
      setFormData({
        name: "",
        thumbnail: "",
      });
    }
  }, [editInterest, open]);

  const resetForm = () => {
    if (!editInterest) {
      setFormData({
        name: "",
        thumbnail: "",
      });
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 200;
          const maxHeight = 200;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height / width) * maxWidth;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width / height) * maxHeight;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.5);
          resolve(compressedDataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedThumbnail = await compressImage(file);
      setFormData({ ...formData, thumbnail: compressedThumbnail });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter the category name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editInterest) {
        // Update mode
        const updatedInterest: Interest = {
          ...editInterest,
          name: formData.name,
          thumbnail: formData.thumbnail || undefined,
          isActive: true,
          interestCategory: editInterest.interestCategory,
          subInterests: editInterest.subInterests || [],
        };

        await onUpdate?.(updatedInterest);

        toast({
          title: "Success",
          description: `Category "${formData.name}" updated successfully`,
          variant: "default",
        });
      } else {
        // Add mode
        const newInterest: Interest = {
          id: `interest-${Date.now()}`,
          name: formData.name,
          thumbnail: formData.thumbnail || undefined,
          userCount: 0,
          isActive: true,
          interestCategory: undefined,
          subInterests: [],
        };

        await onAdd?.(newInterest);

        toast({
          title: "Success",
          description: `Category "${formData.name}" added successfully`,
          variant: "default",
        });
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during the operation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editInterest ? "Edit Interest" : "Add New Interest"}
          </DialogTitle>
          <DialogDescription>
            {editInterest
              ? "Update main category information"
              : "Create a new main category"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Category Name</Label>
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
                  Upload Thumbnail
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
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : editInterest
              ? "Update"
              : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
