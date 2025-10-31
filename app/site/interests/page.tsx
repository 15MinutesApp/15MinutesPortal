"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ADMIN_CREATE_INTEREST,
  ADMIN_CREATE_INTEREST_CATEGORY,
  ADMIN_DELETE_INTEREST,
  ADMIN_DELETE_INTEREST_CATEGORY,
  ADMIN_INTEREST_CATEGORIES,
  ADMIN_UPDATE_INTEREST,
  ADMIN_UPDATE_INTEREST_CATEGORY,
  ADMIN_UPDATE_INTEREST_STATUS,
} from "@/lib/apollo/queries";
import { useMutation, useQuery } from "@apollo/client/react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddInterestDialog } from "./main/add/page";
import { EditInterestDialog } from "./main/edit/page";
import { AddSubInterestDialog } from "./sub/add/page";
import { EditSubInterestDialog } from "./sub/edit/page";
import { Interest } from "./types";

interface GraphQLInterest {
  id: string;
  name: string;
  thumbnail?: string;
  userCount: number;
}

interface GraphQLInterestCategory {
  id: string;
  name: string;
  thumbnail?: string;
  userCount: number;
  interestCount: number;
  interests: GraphQLInterest[];
}

interface GraphQLResponse {
  Admin_interestCategories: GraphQLInterestCategory[];
}

export default function InterestsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = React.useState<string | null>(
    null
  );
  const [addSubDialogOpen, setAddSubDialogOpen] = React.useState<string | null>(
    null
  );
  const [editSubDialogOpen, setEditSubDialogOpen] = React.useState<
    string | null
  >(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState<
    string | null
  >(null);
  const [deleteSubConfirmOpen, setDeleteSubConfirmOpen] = React.useState<{
    parentId: string;
    subId: string;
  } | null>(null);
  const [addMainDialogOpen, setAddMainDialogOpen] = React.useState(false);
  const [openCategories, setOpenCategories] = React.useState<string[]>([]);

  const {
    data: graphqlData,
    loading: graphqlLoading,
    error,
    refetch,
  } = useQuery<GraphQLResponse>(ADMIN_INTEREST_CATEGORIES);

  const [updateInterestStatus] = useMutation(ADMIN_UPDATE_INTEREST_STATUS, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });
  const [createInterest] = useMutation(ADMIN_CREATE_INTEREST, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });
  const [createInterestCategory] = useMutation(ADMIN_CREATE_INTEREST_CATEGORY, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });
  const [updateInterest] = useMutation(ADMIN_UPDATE_INTEREST, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });
  const [updateInterestCategory] = useMutation(ADMIN_UPDATE_INTEREST_CATEGORY, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });
  const [deleteInterest] = useMutation(ADMIN_DELETE_INTEREST, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });
  const [deleteInterestCategory] = useMutation(ADMIN_DELETE_INTEREST_CATEGORY, {
    refetchQueries: [{ query: ADMIN_INTEREST_CATEGORIES }],
  });

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return interests;
    return interests.filter(
      (interest) =>
        interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (interest.subInterests || []).some((sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [interests, searchTerm]);

  useEffect(() => {
    if (graphqlData?.Admin_interestCategories) {
      const transformedInterests: Interest[] =
        graphqlData.Admin_interestCategories.map(
          (category: GraphQLInterestCategory) => {
            return {
              id: category.id,
              name: category.name,
              thumbnail: category.thumbnail,
              userCount: category.userCount,
              isActive: true,
              interestCategory: { id: category.id, name: category.name },
              subInterests: (category.interests || []).map((interest) => ({
                id: interest.id,
                name: interest.name,
                thumbnail: interest.thumbnail,
                userCount: interest.userCount,
                isActive: true,
                interestCategory: { id: category.id, name: category.name },
                subInterests: [],
              })),
            };
          }
        );
      setInterests(transformedInterests);
    }
    // Note: Error handling is done by Apollo Client errorLink for refresh token mechanism
    // Don't manually handle auth errors here to allow refresh token flow to work
  }, [graphqlData, graphqlLoading, error, router]);

  const handleAddInterest = async (newInterest: Interest) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    try {
      if (!newInterest.name) {
        toast({
          title: "Hata",
          description: "Kategori adı boş olamaz",
          variant: "destructive",
        });
        return;
      }

      const inputData = {
        name: newInterest.name,
      };

      console.log("Creating category with input:", inputData);

      const result = await createInterestCategory({
        variables: { input: inputData },
      });

      console.log("Category creation result:", result);

      // Upload thumbnail if provided
      if (
        newInterest.thumbnail &&
        result.data &&
        typeof result.data === "object" &&
        "Admin_createInterestCategory" in result.data
      ) {
        const categoryData = result.data as any;
        const categoryId = categoryData.Admin_createInterestCategory?.id;
        if (categoryId) {
          try {
            await uploadThumbnail(
              categoryId,
              "interestCategory",
              newInterest.thumbnail
            );
            console.log("Thumbnail upload completed successfully");
          } catch (uploadError) {
            console.error("Thumbnail upload failed:", uploadError);
          }
        }
      }

      // Force refetch to get latest data with thumbnails
      await refetch();
    } catch (error: any) {
      const errorDetails = error?.graphQLErrors || error?.errors || [];
      const firstError = errorDetails[0];
      const specificError = firstError?.extensions?.originalError || firstError;
      const errorMessage =
        specificError?.message || error?.message || String(error);

      toast({
        title: "Hata",
        description: `Kategori oluşturulurken bir hata oluştu: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const uploadThumbnail = async (
    entityId: string,
    collection: "interest" | "interestCategory",
    base64Image: string
  ) => {
    // Convert base64 to blob
    const base64Data = base64Image.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // Create FormData
    const formData = new FormData();
    formData.append("file", blob, "thumbnail.jpg");
    formData.append("collection", collection);
    formData.append("entityId", entityId);

    console.log("[Upload] Uploading thumbnail:", {
      entityId,
      collection,
      fileSize: blob.size,
    });

    // Upload to backend via Next.js API route
    const response = await fetch("/api/upload/thumbnail", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const responseText = await response.text();
    console.log("[Upload] Response status:", response.status);
    console.log("[Upload] Response:", responseText);

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} - ${responseText}`);
    }
  };

  const handleUpdateInterest = async (updatedInterest: Interest) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    try {
      // Backend currently only accepts specific fields
      const updateInput: any = {
        id: updatedInterest.id,
        name: updatedInterest.name,
        isActive: updatedInterest.isActive,
      };

      await updateInterestCategory({
        variables: {
          input: updateInput,
        },
      });

      // Upload thumbnail if provided
      if (
        updatedInterest.thumbnail &&
        updatedInterest.thumbnail.startsWith("data:image")
      ) {
        console.log(
          "Uploading thumbnail for updated category:",
          updatedInterest.id
        );
        try {
          await uploadThumbnail(
            updatedInterest.id,
            "interestCategory",
            updatedInterest.thumbnail
          );
          console.log("Category thumbnail upload completed successfully");
        } catch (uploadError) {
          console.error("Category thumbnail upload failed:", uploadError);
        }
      } else {
        console.log("No new thumbnail to upload for category");
      }

      toast({
        title: "Başarılı",
        description: "Kategori başarıyla güncellendi",
        variant: "default",
      });

      // Force refetch to update UI
      await refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        toast({
          title: "Hata",
          description: `Kategori güncellenirken bir hata oluştu: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleAddSubInterest = async (
    parentId: string,
    subInterest: Interest
  ) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    try {
      // Backend currently only accepts 'name' and 'interestCategoryId' fields
      const inputData = {
        name: subInterest.name,
        interestCategoryId: parentId,
      };
      console.log("Creating sub interest with input:", inputData);
      console.log("Sub interest has thumbnail:", !!subInterest.thumbnail);

      const result = await createInterest({
        variables: {
          input: inputData,
        },
      });

      console.log("Sub interest creation result:", result);

      // Upload thumbnail if provided
      if (subInterest.thumbnail && result.data) {
        const interestData = result.data as any;
        const interestId = interestData?.Admin_createInterest?.id;
        console.log("Uploading thumbnail for interest ID:", interestId);

        if (interestId) {
          try {
            await uploadThumbnail(
              interestId,
              "interest",
              subInterest.thumbnail
            );
            console.log("Thumbnail upload completed successfully");
          } catch (uploadError) {
            console.error("Thumbnail upload failed:", uploadError);
            toast({
              title: "Uyarı",
              description:
                "Alt kategori oluşturuldu ancak thumbnail yüklenemedi",
              variant: "default",
            });
          }
        } else {
          console.warn("No interest ID returned from creation");
        }
      } else {
        console.log("No thumbnail to upload for sub interest");
      }

      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla oluşturuldu",
        variant: "default",
      });

      // Force refetch to get latest data
      await refetch();

      // Open the parent category accordion
      if (!openCategories.includes(parentId)) {
        setOpenCategories([...openCategories, parentId]);
      }
    } catch (error: any) {
      const errorDetails = error?.graphQLErrors || error?.errors || [];
      const firstError = errorDetails[0];
      const specificError = firstError?.extensions?.originalError || firstError;
      const errorMessage =
        specificError?.message || error?.message || String(error);

      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        toast({
          title: "Hata",
          description: `Alt kategori oluşturulurken bir hata oluştu: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateSubInterest = async (
    parentId: string,
    updatedSubInterest: Interest
  ) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    try {
      // Backend currently only accepts specific fields
      const updateInput: any = {
        id: updatedSubInterest.id,
        name: updatedSubInterest.name,
        interestCategoryId: parentId,
        isActive: updatedSubInterest.isActive,
      };

      await updateInterest({
        variables: {
          input: updateInput,
        },
      });

      // Upload thumbnail if provided
      if (
        updatedSubInterest.thumbnail &&
        updatedSubInterest.thumbnail.startsWith("data:image")
      ) {
        console.log(
          "Uploading thumbnail for updated sub interest:",
          updatedSubInterest.id
        );
        try {
          await uploadThumbnail(
            updatedSubInterest.id,
            "interest",
            updatedSubInterest.thumbnail
          );
          console.log("Sub interest thumbnail upload completed successfully");
        } catch (uploadError) {
          console.error("Sub interest thumbnail upload failed:", uploadError);
        }
      } else {
        console.log("No new thumbnail to upload for sub interest");
      }

      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla güncellendi",
        variant: "default",
      });

      // Force refetch to update UI
      await refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        toast({
          title: "Hata",
          description: `Alt kategori güncellenirken bir hata oluştu: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleInterestStatus = async (
    interestId: string,
    isActive: boolean
  ) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    const originalState = interests.find((i) => i.id === interestId)?.isActive;
    setInterests((prev) =>
      prev.map((i) => (i.id === interestId ? { ...i, isActive } : i))
    );
    try {
      await updateInterestStatus({
        variables: { input: { id: interestId, isActive } },
      });
    } catch (error) {
      setInterests((prev) =>
        prev.map((i) =>
          i.id === interestId
            ? { ...i, isActive: originalState ?? !isActive }
            : i
        )
      );
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        alert(
          "Kategori durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    }
  };

  const handleToggleSubInterestStatus = async (
    parentId: string,
    subInterestId: string,
    isActive: boolean
  ) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    const parent = interests.find((i) => i.id === parentId);
    const originalState = parent?.subInterests?.find(
      (s) => s.id === subInterestId
    )?.isActive;
    setInterests((prev) =>
      prev.map((i) =>
        i.id === parentId
          ? {
              ...i,
              subInterests: (i.subInterests || []).map((s) =>
                s.id === subInterestId ? { ...s, isActive } : s
              ),
            }
          : i
      )
    );
    try {
      await updateInterestStatus({
        variables: { input: { id: subInterestId, isActive } },
      });
    } catch (error) {
      setInterests((prev) =>
        prev.map((i) =>
          i.id === parentId
            ? {
                ...i,
                subInterests: (i.subInterests || []).map((s) =>
                  s.id === subInterestId
                    ? { ...s, isActive: originalState ?? !isActive }
                    : s
                ),
              }
            : i
        )
      );
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        alert(
          "Alt kategori durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    }
  };

  const handleDeleteInterest = async (interestId: string) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    try {
      await deleteInterestCategory({ variables: { id: interestId } });
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla silindi",
        variant: "default",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        toast({
          title: "Hata",
          description: `Kategori silinirken bir hata oluştu: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteSubInterest = async (
    parentId: string,
    subInterestId: string
  ) => {
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }
    try {
      await deleteInterest({ variables: { id: subInterestId } });
      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla silindi",
        variant: "default",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        toast({
          title: "Hata",
          description: `Alt kategori silinirken bir hata oluştu: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || graphqlLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-auto shrink-0 items-start gap-2 bg-card px-10 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">İlgi Alanları</h1>
          <h2 className="text-muted-foreground">
            Kullanıcıların ilgi alanlarını kategoriler ve alt kategoriler
            halinde yönetin.
          </h2>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-end gap-3 px-10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
            <Input
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-pink-500/30 focus-visible:ring-pink-500/50 focus-visible:border-pink-500/50"
            />
          </div>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setAddMainDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori Ekle
          </Button>
        </div>

        <div className="px-10">
          {/* FULL PEMBE ZEMİN + AYNI HİZALAMA */}
          <Accordion
            type="multiple"
            className="rounded-xl overflow-hidden"
            value={openCategories}
            onValueChange={setOpenCategories}
          >
            {filteredData.map((interest) => (
              <AccordionItem
                key={interest.id}
                value={interest.id}
                className="border-b border-pink-200/40"
              >
                {/* ANA KATEGORI SATIRI */}
                <div className="w-full bg-pink-500/10 hover:bg-pink-500/15 transition-colors">
                  <div className="grid grid-cols-12 items-center gap-3 px-3 py-2 ">
                    {/* Sol: Switch + ikon + ad */}
                    <div className="col-span-6 flex items-center gap-3">
                      <Switch
                        checked={interest.isActive}
                        onCheckedChange={(checked) => {
                          handleToggleInterestStatus(interest.id, checked);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="data-[state=checked]:bg-pink-500/60"
                      />
                      {interest.thumbnail ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-pink-500/30 bg-pink-500/10 ml-5">
                          <img
                            src={interest.thumbnail}
                            alt={interest.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-pink-500/30 bg-pink-500/10 ml-3">
                          <span className="text-lg">🎯</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">
                          {interest.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ana kategori
                        </div>
                      </div>
                    </div>

                    {/* Orta: rozetler ORTADA */}
                    <div className="col-span-4 flex items-center justify-center gap-2 mr-60">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-2xl text-xs font-medium bg-pink-600/15 text-pink-700 border border-pink-600/25">
                        {(interest.subInterests || []).length} alt kategori
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-2xl text-xs font-medium bg-pink-600/15 text-pink-700 border border-pink-600/25">
                        {interest.userCount.toLocaleString("tr-TR")} kullanıcı
                      </span>
                    </div>

                    {/* Aksiyonlar (chevron'dan önce) */}
                    <div
                      className="col-span-1 flex items-center justify-end gap-1"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-pink-600/20 hover:text-pink-700"
                        title="Düzenle"
                        onClick={() => setEditDialogOpen(interest.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-pink-600/20 hover:text-pink-700"
                        title="Alt Kategori Ekle"
                        onClick={() => setAddSubDialogOpen(interest.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                        title="Sil"
                        onClick={() => setDeleteConfirmOpen(interest.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* En sağ: SADECE akordeon trigger (chevron) */}
                    <div className="col-span-1 flex items-center justify-end">
                      <AccordionTrigger className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-pink-600/20 data-[state=open]:rotate-180 transition-transform">
                        <span className="sr-only">Detayları aç/kapat</span>
                        {/* shadcn kendi ikonunu koyar; istersen buraya özel ikon ekleyebilirsin */}
                      </AccordionTrigger>
                    </div>
                  </div>
                </div>

                {/* ALT KATEGORİ LİSTESİ */}
                <AccordionContent className="p-0">
                  {(interest.subInterests || []).map((sub, index) => (
                    <div
                      key={sub.id}
                      className="w-full bg-blue-500/10 hover:bg-blue-500/15 transition-colors pl-5 relative"
                    >
                      {index > 0 && (
                        <div className="absolute top-0 left-[0.75rem] right-[calc(7%+0.25rem)] h-[1px] bg-blue-500/20" />
                      )}
                      <div className="grid grid-cols-12 items-center gap-3 px-3 py-2">
                        {/* Sol: Switch + ikon + ad (AYNI HİZA) */}
                        <div className="col-span-6 flex items-center gap-3">
                          <Switch
                            checked={sub.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleSubInterestStatus(
                                interest.id,
                                sub.id,
                                checked
                              )
                            }
                            className="data-[state=checked]:bg-blue-500/60"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-blue-500/30 bg-blue-500/10 ml-5">
                            {sub.thumbnail ? (
                              <img
                                src={sub.thumbnail}
                                alt={sub.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-lg">🎮</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground text-sm truncate">
                              {sub.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sub.interestCategory?.name || "Alt kategori"}
                            </div>
                          </div>
                        </div>

                        {/* Orta: rozetler ORTADA (AYNI HİZA) */}
                        <div className="col-span-4 flex items-center justify-center gap-2 mr-60">
                          {/* Alt kategori için sol rozet sabit metin */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-2xl text-xs font-medium bg-blue-600/15 text-blue-700 border border-blue-600/25">
                            alt kategori
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-2xl text-xs font-medium bg-blue-600/15 text-blue-700 border border-blue-600/25">
                            {sub.userCount.toLocaleString("tr-TR")} kullanıcı
                          </span>
                        </div>

                        {/* Aksiyonlar */}
                        <div
                          className="col-span-1 flex items-center justify-end gap-1"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-blue-600/20 hover:text-blue-700"
                            title="Düzenle"
                            onClick={() => setEditSubDialogOpen(sub.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-red-500/20 hover:text-red-500"
                            title="Sil"
                            onClick={() =>
                              setDeleteSubConfirmOpen({
                                parentId: interest.id,
                                subId: sub.id,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* En sağ: alt satırda akordeon yok, boşluk koru */}
                        <div className="col-span-1" />
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex items-center justify-between px-10">
          <div className="text-sm text-muted-foreground">
            Toplam {filteredData.length} kategori
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredData.reduce(
              (acc, i) => acc + (i.subInterests || []).length,
              0
            )}{" "}
            Alt kategori
          </div>
        </div>
      </div>

      <Toaster />

      {/* Add Main Interest Dialog */}
      {addMainDialogOpen && (
        <AddInterestDialog
          onAdd={handleAddInterest}
          interestCategories={interests.map((i) => ({
            id: i.id,
            name: i.name,
          }))}
          open={true}
          onOpenChange={(open) => {
            if (!open) setAddMainDialogOpen(false);
          }}
        />
      )}

      {/* Edit Main Interest Dialog */}
      {(() => {
        const interestToEdit = interests.find((i) => i.id === editDialogOpen);
        return editDialogOpen && interestToEdit ? (
          <EditInterestDialog
            editInterest={interestToEdit}
            onUpdate={handleUpdateInterest}
            interestCategories={interests.map((i) => ({
              id: i.id,
              name: i.name,
            }))}
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditDialogOpen(null);
            }}
          />
        ) : null;
      })()}

      {/* Add Sub Interest Dialog */}
      {(() => {
        const parentInterest = interests.find((i) => i.id === addSubDialogOpen);
        return addSubDialogOpen && parentInterest ? (
          <AddSubInterestDialog
            parentInterest={parentInterest}
            onAdd={(subInterest) => {
              if (addSubDialogOpen)
                handleAddSubInterest(addSubDialogOpen, subInterest);
            }}
            open={true}
            onOpenChange={(open) => {
              if (!open) setAddSubDialogOpen(null);
            }}
          />
        ) : null;
      })()}

      {/* Edit Sub Interest Dialog */}
      {(() => {
        const subInterest = interests
          .flatMap((i) => i.subInterests || [])
          .find((s) => s.id === editSubDialogOpen);
        const parentInterest = interests.find((i) =>
          (i.subInterests || []).some((s) => s.id === editSubDialogOpen)
        );
        return editSubDialogOpen && subInterest && parentInterest ? (
          <EditSubInterestDialog
            parentInterest={parentInterest}
            editSubInterest={subInterest}
            onUpdate={(updatedSubInterest) => {
              handleUpdateSubInterest(parentInterest.id, updatedSubInterest);
            }}
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditSubDialogOpen(null);
            }}
          />
        ) : null;
      })()}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen &&
        (() => {
          const interestToDelete = interests.find(
            (i) => i.id === deleteConfirmOpen
          );
          return (
            <Dialog open={true} onOpenChange={() => setDeleteConfirmOpen(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kategoriyi Sil</DialogTitle>
                  <DialogDescription>
                    <strong>"{interestToDelete?.name}"</strong> ana kategoriyi
                    ve tüm alt kategorilerini silmek istediğinizden emin
                    misiniz?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmOpen(null)}
                    type="button"
                  >
                    İptal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteInterest(deleteConfirmOpen as string);
                      setDeleteConfirmOpen(null);
                    }}
                    type="button"
                  >
                    Sil
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()}

      {/* Delete Sub Interest Confirmation Dialog */}
      {deleteSubConfirmOpen &&
        (() => {
          const subInterestToDelete = interests
            .flatMap((i) => i.subInterests || [])
            .find((s) => s.id === deleteSubConfirmOpen.subId);
          return (
            <Dialog
              open={true}
              onOpenChange={() => setDeleteSubConfirmOpen(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alt Kategoriyi Sil</DialogTitle>
                  <DialogDescription>
                    <strong>"{subInterestToDelete?.name}"</strong> alt
                    kategoriyi silmek istediğinizden emin misiniz?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteSubConfirmOpen(null)}
                    type="button"
                  >
                    İptal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteSubInterest(
                        deleteSubConfirmOpen!.parentId,
                        deleteSubConfirmOpen!.subId
                      );
                      setDeleteSubConfirmOpen(null);
                    }}
                    type="button"
                  >
                    Sil
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()}
    </div>
  );
}
