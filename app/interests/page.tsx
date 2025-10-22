"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { InterestsAccordion } from "../../components/interests-accordion";
// import { interestsData } from "./data";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Interest, SubInterest } from "./types";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ADMIN_INTEREST_CATEGORIES,
  ADMIN_UPDATE_INTEREST_STATUS,
  ADMIN_CREATE_INTEREST,
  ADMIN_CREATE_INTEREST_CATEGORY,
  ADMIN_UPDATE_INTEREST,
  ADMIN_UPDATE_INTEREST_CATEGORY,
} from "@/lib/apollo/queries";

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

  const {
    data: graphqlData,
    loading: graphqlLoading,
    error,
  } = useQuery<GraphQLResponse>(ADMIN_INTEREST_CATEGORIES);

  const [updateInterestStatus] = useMutation(ADMIN_UPDATE_INTEREST_STATUS);
  const [createInterest] = useMutation(ADMIN_CREATE_INTEREST);
  const [createInterestCategory] = useMutation(ADMIN_CREATE_INTEREST_CATEGORY);
  const [updateInterest] = useMutation(ADMIN_UPDATE_INTEREST);
  const [updateInterestCategory] = useMutation(ADMIN_UPDATE_INTEREST_CATEGORY);

  useEffect(() => {
    if (graphqlData?.Admin_interestCategories) {
      console.log("GraphQL data received:", graphqlData);

      // Transform interest categories to Interest format
      const transformedInterests: Interest[] =
        graphqlData.Admin_interestCategories.map(
          (category: GraphQLInterestCategory) => ({
            id: category.id,
            name: category.name,
            thumbnail: category.thumbnail,
            userCount: category.userCount,
            isActive: true, // Default to true
            interestCategory: {
              id: category.id,
              name: category.name,
            },
            subInterests: category.interests.map(
              (interest: GraphQLInterest) => ({
                id: interest.id,
                name: interest.name,
                thumbnail: interest.thumbnail,
                userCount: interest.userCount,
                isActive: true, // Default to true
                interestCategory: {
                  id: category.id,
                  name: category.name,
                },
                subInterests: [],
              })
            ),
          })
        );
      console.log("Transformed interests:", transformedInterests);
      setInterests(transformedInterests);
    } else if (!graphqlLoading && !error) {
      console.log("No GraphQL data, using fallback");
      // Fallback to local data if GraphQL fails
      const savedInterests = localStorage.getItem("interests");
      if (savedInterests) {
        setInterests(JSON.parse(savedInterests));
      } else {
        // No fallback data, start with empty array
        setInterests([]);
      }
    }
  }, [graphqlData, graphqlLoading, error]);

  const handleAddInterest = async (newInterest: Interest) => {
    // Check authentication status
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    try {
      console.log("Creating new interest:", newInterest);
      console.log("Available interests for category:", interests);

      // For main categories, we need to create them as interests with a default category
      console.log("Attempting to create main category:", newInterest.name);

      // For main categories, we need to create them as interest categories
      // Let's try to create without a parent category first
      console.log("Attempting to create main category:", newInterest.name);

      const inputData = {
        name: newInterest.name,
        thumbnail: newInterest.thumbnail || null,
      };

      console.log("Sending to backend:", inputData);

      // For main categories, use Admin_createInterestCategory
      const result = await createInterestCategory({
        variables: {
          input: inputData,
        },
      });

      console.log("Main category created successfully:", result);

      // Refresh data from backend
      window.location.reload();
    } catch (error) {
      console.error("Error creating interest:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        alert(`Kategori oluşturulurken bir hata oluştu: ${errorMessage}`);
      }
    }
  };

  const handleUpdateInterest = async (updatedInterest: Interest) => {
    // Check authentication status
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    try {
      console.log("Updating interest:", updatedInterest);

      // For main categories, use Admin_updateInterestCategory
      const result = await updateInterestCategory({
        variables: {
          input: {
            id: updatedInterest.id,
            name: updatedInterest.name,
            thumbnail: updatedInterest.thumbnail || null,
            isActive: updatedInterest.isActive,
          },
        },
      });

      console.log("Main category updated successfully:", result);

      // Refresh data from backend
      window.location.reload();
    } catch (error) {
      console.error("Error updating interest:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        alert(`Kategori güncellenirken bir hata oluştu: ${errorMessage}`);
      }
    }
  };

  const handleAddSubInterest = async (
    parentId: string,
    subInterest: Interest
  ) => {
    // Check authentication status
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    try {
      console.log("Creating new sub-interest:", subInterest);
      console.log("Parent ID:", parentId);

      const result = await createInterest({
        variables: {
          input: {
            name: subInterest.name,
            interestCategoryId: parentId, // parentId is the main category ID
            thumbnail: subInterest.thumbnail || null,
          },
        },
      });

      console.log("Sub-interest created successfully:", result);

      // Refresh data from backend
      window.location.reload();
    } catch (error) {
      console.error("Error creating sub-interest:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        alert(`Alt kategori oluşturulurken bir hata oluştu: ${errorMessage}`);
      }
    }
  };

  const handleUpdateSubInterest = async (
    parentId: string,
    updatedSubInterest: Interest
  ) => {
    // Check authentication status
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    try {
      console.log("Updating sub-interest:", updatedSubInterest);

      const result = await updateInterest({
        variables: {
          input: {
            id: updatedSubInterest.id,
            name: updatedSubInterest.name,
            interestCategoryId: parentId,
            thumbnail: updatedSubInterest.thumbnail || null,
            isActive: updatedSubInterest.isActive,
          },
        },
      });

      console.log("Sub-interest updated successfully:", result);

      // Refresh data from backend
      window.location.reload();
    } catch (error) {
      console.error("Error updating sub-interest:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Admin authentication required")) {
        alert("Admin yetkisi gerekli. Lütfen giriş yapın.");
      } else {
        alert(`Alt kategori güncellenirken bir hata oluştu: ${errorMessage}`);
      }
    }
  };

  const handleToggleInterestStatus = async (
    interestId: string,
    isActive: boolean
  ) => {
    // Check authentication status
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    // Store original state for rollback
    const originalState = interests.find(
      (interest) => interest.id === interestId
    )?.isActive;

    // Optimistic update - immediately update UI
    setInterests((prev) =>
      prev.map((interest) =>
        interest.id === interestId ? { ...interest, isActive } : interest
      )
    );

    try {
      console.log("Updating interest status:", {
        interestId,
        isActive,
        isAuthenticated,
      });

      const result = await updateInterestStatus({
        variables: {
          input: {
            id: interestId,
            isActive,
          },
        },
      });

      console.log("Interest status updated successfully:", result);
    } catch (error) {
      console.error("Error updating interest status:", error);

      // Revert optimistic update on error
      setInterests((prev) =>
        prev.map((interest) =>
          interest.id === interestId
            ? { ...interest, isActive: originalState ?? !isActive }
            : interest
        )
      );

      // Show user-friendly error message
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
    // Check authentication status
    if (!isAuthenticated) {
      alert("Bu işlem için giriş yapmanız gerekiyor.");
      return;
    }

    // Store original state for rollback
    const parentInterest = interests.find(
      (interest) => interest.id === parentId
    );
    const originalState = parentInterest?.subInterests?.find(
      (sub) => sub.id === subInterestId
    )?.isActive;

    // Optimistic update - immediately update UI
    setInterests((prev) =>
      prev.map((interest) => {
        if (interest.id === parentId) {
          return {
            ...interest,
            subInterests: (interest.subInterests || []).map((sub) =>
              sub.id === subInterestId ? { ...sub, isActive } : sub
            ),
          };
        }
        return interest;
      })
    );

    try {
      console.log("Updating sub-interest status:", {
        subInterestId,
        isActive,
        isAuthenticated,
      });

      const result = await updateInterestStatus({
        variables: {
          input: {
            id: subInterestId,
            isActive,
          },
        },
      });

      console.log("Sub-interest status updated successfully:", result);
    } catch (error) {
      console.error("Error updating sub-interest status:", error);

      // Revert optimistic update on error
      setInterests((prev) =>
        prev.map((interest) => {
          if (interest.id === parentId) {
            return {
              ...interest,
              subInterests: (interest.subInterests || []).map((sub) =>
                sub.id === subInterestId
                  ? { ...sub, isActive: originalState ?? !isActive }
                  : sub
              ),
            };
          }
          return interest;
        })
      );

      // Show user-friendly error message
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider className="dark">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-card  px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-2xl font-bold text-foreground">
              İlgi Alanları
            </h1>
          </div>
        </header>
        <div className=" flex flex-1 flex-col gap-6 mr-10 ml-16">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Kullanıcıların ilgi alanlarını kategoriler ve alt kategoriler
              halinde yönetin.
            </p>
          </div>
          <InterestsAccordion
            data={interests}
            onAdd={handleAddInterest}
            onUpdate={handleUpdateInterest}
            onAddSubInterest={handleAddSubInterest}
            onUpdateSubInterest={handleUpdateSubInterest}
            onToggleInterestStatus={handleToggleInterestStatus}
            onToggleSubInterestStatus={handleToggleSubInterestStatus}
            interestCategories={interests.map((interest) => ({
              id: interest.id,
              name: interest.name,
            }))}
          />
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
