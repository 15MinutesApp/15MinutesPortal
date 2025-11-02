"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { Pencil, Plus, Search, Trash2, FolderTree, Layers } from "lucide-react";
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
      alert("You need to sign in to perform this action.");
      return;
    }

    try {
      if (!newInterest.name) {
        toast({
          title: "Error",
          description: "Category name cannot be empty",
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
        title: "Error",
        description: `An error occurred while creating the category: ${errorMessage}`,
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
      alert("You need to sign in to perform this action.");
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
        title: "Success",
        description: "Category updated successfully",
        variant: "default",
      });

      // Force refetch to update UI
      await refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin privileges required. Please sign in.");
      } else {
        toast({
          title: "Error",
          description: `An error occurred while updating the category: ${errorMessage}`,
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
      alert("You need to sign in to perform this action.");
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
              title: "Warning",
              description:
                "Sub category created but thumbnail could not be uploaded",
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
        title: "Success",
        description: "Sub category created successfully",
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
        alert("Admin privileges required. Please sign in.");
      } else {
        toast({
          title: "Error",
          description: `An error occurred while creating the sub category: ${errorMessage}`,
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
      alert("You need to sign in to perform this action.");
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
        title: "Success",
        description: "Sub category updated successfully",
        variant: "default",
      });

      // Force refetch to update UI
      await refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin privileges required. Please sign in.");
      } else {
        toast({
          title: "Error",
          description: `An error occurred while updating the sub category: ${errorMessage}`,
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
      alert("You need to sign in to perform this action.");
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
        alert("Admin privileges required. Please sign in.");
      } else {
        alert(
          "An error occurred while updating the category status. Please try again."
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
      alert("You need to sign in to perform this action.");
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
        alert("Admin privileges required. Please sign in.");
      } else {
        alert(
          "An error occurred while updating the sub category status. Please try again."
        );
      }
    }
  };

  const handleDeleteInterest = async (interestId: string) => {
    if (!isAuthenticated) {
      alert("You need to sign in to perform this action.");
      return;
    }
    try {
      await deleteInterestCategory({ variables: { id: interestId } });
      toast({
        title: "Success",
        description: "Category deleted successfully",
        variant: "default",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin privileges required. Please sign in.");
      } else {
        toast({
          title: "Error",
          description: `An error occurred while deleting the category: ${errorMessage}`,
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
      alert("You need to sign in to perform this action.");
      return;
    }
    try {
      await deleteInterest({ variables: { id: subInterestId } });
      toast({
        title: "Success",
        description: "Sub category deleted successfully",
        variant: "default",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin privileges required. Please sign in.");
      } else {
        toast({
          title: "Error",
          description: `An error occurred while deleting the sub category: ${errorMessage}`,
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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-pink-400/30 transition-[width,height] ease-linear mb-4">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-4">
          <div className="flex items-center gap-1 ml-6">
            <Separator
              orientation="vertical"
              className="mr-1 data-[orientation=vertical]:h-6 bg-pink-400/30"
            />
            <h1 className="text-xl font-medium">Interests</h1>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-14">
          {/* Statistics Cards */}
          <div className="flex gap-4">
            <Card className="bg-blue-100/30 dark:bg-blue-900/20 w-[190px] h-10 flex items-center justify-center">
              <CardContent className="px-3 py-0 w-full">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2 mr-1" />
                  <CardTitle className="text-xs font-medium text-foreground whitespace-nowrap">
                    Main Categories
                  </CardTitle>
                  <div className="text-sm font-bold text-foreground ">
                    {filteredData.length}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-100/30 dark:bg-blue-900/20 w-[190px] h-10 flex items-center justify-center">
              <CardContent className="px-3 py-0 w-full">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2 mr-1" />
                  <CardTitle className="text-xs font-medium text-foreground whitespace-nowrap">
                    Sub Categories
                  </CardTitle>
                  <div className="text-sm font-bold text-foreground ">
                    {filteredData.reduce(
                      (acc, i) => acc + (i.subInterests || []).length,
                      0
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-60 border-pink-400/30 focus-visible:ring-pink-400/50 focus-visible:border-pink-400/50"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddMainDialogOpen(true)}
              className="bg-pink-400/40 text-foreground border-pink-300/40 hover:bg-pink-300 hover:border-pink-300"
            >
              <Plus className="text-foreground" />
              <span className="hidden text-foreground lg:inline">
                Add New Category
              </span>
            </Button>
          </div>
        </div>

        <div className="px-14">
          {/* FULL PEMBE ZEMİN + AYNI HİZALAMA */}
          <div className=" mx-auto border-2 border-pink-400/30 rounded-xl overflow-hidden">
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
                  className="border-b border-pink-400/30"
                >
                  {/* ANA KATEGORI SATIRI */}
                  <div className="w-full bg-pink-300/8 hover:bg-pink-300/10 transition-colors">
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
                            Main category
                          </div>
                        </div>
                      </div>

                      {/* Orta: rozetler ORTADA */}
                      <div className="col-span-4 flex items-center justify-center gap-2 mr-60">
                        <span className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-pink-300/10 text-pink-600 border border-pink-600/25 whitespace-nowrap">
                          {(interest.subInterests || []).length} sub categories
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-pink-300/10 text-pink-600 border border-pink-600/25 whitespace-nowrap">
                          {interest.userCount.toLocaleString("en-US")} users
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
                          title="Edit"
                          onClick={() => setEditDialogOpen(interest.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-pink-600/20 hover:text-pink-700"
                          title="Add Sub Category"
                          onClick={() => setAddSubDialogOpen(interest.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                          title="Delete"
                          onClick={() => setDeleteConfirmOpen(interest.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* En sağ: SADECE akordeon trigger (chevron) */}
                      <div className="col-span-1 flex items-center justify-end">
                        <AccordionTrigger className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-pink-600/20 data-[state=open]:rotate-180 transition-transform">
                          <span className="sr-only">Toggle details</span>
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
                        className="w-full bg-blue-300/8 hover:bg-blue-500/15 transition-colors pl-5 relative"
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
                                {sub.interestCategory?.name || "Sub category"}
                              </div>
                            </div>
                          </div>

                          {/* Orta: rozetler ORTADA (AYNI HİZA) */}
                          <div className="col-span-4 flex items-center justify-center gap-2 mr-60">
                            {/* Alt kategori için sol rozet sabit metin */}
                            <span className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-blue-600/15 text-blue-700 border border-blue-600/25 whitespace-nowrap">
                              sub category
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-blue-600/15 text-blue-700 border border-blue-600/25 whitespace-nowrap">
                              {sub.userCount.toLocaleString("en-US")} users
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
                              title="Edit"
                              onClick={() => setEditSubDialogOpen(sub.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-red-500/20 hover:text-red-500"
                              title="Delete"
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
                  <DialogTitle>Delete Category</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the main category{" "}
                    <strong>"{interestToDelete?.name}"</strong> and all its sub
                    categories?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmOpen(null)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteInterest(deleteConfirmOpen as string);
                      setDeleteConfirmOpen(null);
                    }}
                    type="button"
                  >
                    Delete
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
                  <DialogTitle>Delete Sub Category</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the sub category{" "}
                    <strong>"{subInterestToDelete?.name}"</strong>?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteSubConfirmOpen(null)}
                    type="button"
                  >
                    Cancel
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
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()}
    </div>
  );
}
