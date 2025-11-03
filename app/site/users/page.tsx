"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Columns,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { z } from "zod";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Fake data as JSON string
const FAKE_USERS_JSON = `[
  {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "password123",
    "phone": "+1 234 567 8900",
    "birthDate": "1990-05-15",
    "role": "premium",
    "interestCount": 5,
    "connectionCount": 12
  },
  {
    "id": 2,
    "name": "Jane",
    "surname": "Smith",
    "email": "jane.smith@example.com",
    "username": "janesmith",
    "password": "password123",
    "phone": "+1 234 567 8901",
    "birthDate": "1992-08-20",
    "role": "free",
    "interestCount": 2,
    "connectionCount": 5
  }
]`;

// Get users from localStorage or initialize empty array
const getUserData = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  const stored = localStorage.getItem("updatedUserData");
  return stored ? JSON.parse(stored) : [];
};

// Schema
const schema = z.object({
  id: z.number(),
  name: z.string(),
  surname: z.string(),
  email: z.string().email(),
  username: z.string(),
  password: z.string(),
  phone: z.string(),
  birthDate: z.string(),
  role: z.enum(["premium", "free"]),
  interestCount: z.number().optional().default(0),
  connectionCount: z.number().optional().default(0),
});

// SiteHeader Component
function SiteHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-pink-400/30 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-4">
        <div className="flex items-center gap-1 ml-6">
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-6 bg-pink-400/30"
          />
          <h1 className="text-xl font-medium">User Management</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              //   href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            ></a>
          </Button>
        </div>
      </div>
    </header>
  );
}

// DataTable Components

function TableCellViewer({
  item,
  onUpdate,
}: {
  item: z.infer<typeof schema>;
  onUpdate: (updatedUser: z.infer<typeof schema>) => void;
}) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/users/edit/${item.id}`);
  };

  return (
    <Button
      variant="link"
      className="text-foreground w-fit px-0 text-left"
      onClick={handleEdit}
    >
      {item.name} {item.surname}
    </Button>
  );
}

function createColumns(
  updateUser: (updatedUser: z.infer<typeof schema>) => void,
  deleteUser: (userId: number) => void,
  data: z.infer<typeof schema>[],
  router: any
): ColumnDef<z.infer<typeof schema>>[] {
  return [
    {
      accessorKey: "phone",
      header: "Phone Number",
      cell: ({ row }) => (
        <div className="w-32">
          <span className="text-sm">{row.original.phone}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      id: "fullName",
      accessorFn: (row) => `${row.name} ${row.surname}`,
      header: "Full Name",
      cell: ({ row }) => {
        return (
          <div className="pl-2">
            <TableCellViewer item={row.original} onUpdate={updateUser} />
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <div className="w-32">
          <span className="text-sm font-mono">{row.original.username}</span>
        </div>
      ),
    },
    {
      accessorKey: "birthDate",
      header: "Birth Date",
      cell: ({ row }) => (
        <div className="w-32">
          <span className="text-sm">{row.original.birthDate}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="w-48">
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "interestCount",
      header: "Interest",
      cell: ({ row }) => (
        <div className="w-24">
          <span className="text-sm">{row.original.interestCount ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "connectionCount",
      header: "Connection",
      cell: ({ row }) => (
        <div className="w-32">
          <span className="text-sm">{row.original.connectionCount ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Subscription",
      cell: ({ row }) => {
        const roleColors = {
          premium:
            "bg-green-100 text-gray-800 dark:bg-green-900 dark:text-gray-200",
          free: "bg-yellow-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        };

        return (
          <Badge
            variant="outline"
            className={`px-2 py-1 ${
              roleColors[row.original.role as keyof typeof roleColors]
            }`}
          >
            {row.original.role}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <MoreVertical />
              <span className="sr-only">Open Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={() => {
                router.push(`/users/edit/${row.original.id}`);
              }}
            >
              Edit
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete ${row.original.name} ${row.original.surname}?`
                  )
                ) {
                  deleteUser(row.original.id);
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function DataTable() {
  const [data, setData] = React.useState<z.infer<typeof schema>[]>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [activeTab, setActiveTab] = React.useState("all-users");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const router = useRouter();

  const updateUser = React.useCallback(
    (updatedUser: z.infer<typeof schema>) => {
      setData((prev: z.infer<typeof schema>[]) =>
        prev.map((user: z.infer<typeof schema>) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
    },
    []
  );

  const deleteUser = React.useCallback((userId: number) => {
    setData((prev: z.infer<typeof schema>[]) =>
      prev.filter((user: z.infer<typeof schema>) => user.id !== userId)
    );
    toast.success("User deleted successfully!");
  }, []);

  // Listen for localStorage changes to update data
  React.useEffect(() => {
    const handleStorageChange = () => {
      // Get all users from localStorage
      const allUsers = getUserData();
      // Sort by ID in descending order (newest first)
      setData(
        allUsers.sort(
          (a: z.infer<typeof schema>, b: z.infer<typeof schema>) => b.id - a.id
        )
      );
    };

    // Initialize fake data if localStorage is empty
    if (typeof window !== "undefined" && window.localStorage) {
      const existingData = localStorage.getItem("updatedUserData");

      if (existingData) {
        // Ensure new fields exist
        const users = JSON.parse(existingData);
        let needsUpdate = false;
        const updatedUsers = users.map((user: any) => {
          if (user.interestCount === undefined) {
            user.interestCount = 0;
            needsUpdate = true;
          }
          if (user.connectionCount === undefined) {
            user.connectionCount = 0;
            needsUpdate = true;
          }
          return user;
        });

        if (needsUpdate) {
          localStorage.setItem("updatedUserData", JSON.stringify(updatedUsers));
        }
      } else {
        // Initialize fake data if localStorage is empty
        const fakeUsers = JSON.parse(FAKE_USERS_JSON);
        localStorage.setItem("updatedUserData", FAKE_USERS_JSON);
      }
    }

    // Load data on mount
    handleStorageChange();

    // Listen for storage events (cross-tab)
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, []);

  // Filter data based on active tab
  const filteredData = React.useMemo(() => {
    if (activeTab === "all-users") {
      return data;
    }
    return data.filter(
      (user: z.infer<typeof schema>) => user.role === activeTab
    );
  }, [data, activeTab]);

  const columns = createColumns(updateUser, deleteUser, data, router);

  // Custom global filter function for comprehensive search
  const globalFilterFn = React.useCallback(
    (row: any, columnId: string, value: string) => {
      // Trim the value and check if it's empty after trimming
      const trimmedValue = value?.trim();
      if (!trimmedValue) return true;

      // Remove spaces from search value for space-insensitive search
      const searchValue = trimmedValue.toLowerCase().replace(/\s+/g, "");
      const user = row.original;

      // Search in all text fields, removing spaces for comparison
      const searchableFields = [
        user.name?.toLowerCase().replace(/\s+/g, "") || "",
        user.surname?.toLowerCase().replace(/\s+/g, "") || "",
        user.email?.toLowerCase().replace(/\s+/g, "") || "",
        user.username?.toLowerCase().replace(/\s+/g, "") || "",
        user.phone?.toLowerCase().replace(/\s+/g, "") || "",
        user.birthDate?.toLowerCase().replace(/\s+/g, "") || "",
        user.role?.toLowerCase().replace(/\s+/g, "") || "",
        (user.interestCount ?? 0).toString(),
        (user.connectionCount ?? 0).toString(),
      ];

      // Check if any field contains the search value
      return searchableFields.some((field) => field.includes(searchValue));
    },
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-14">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-users">All Users</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="bg-pink-300/10 **:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="premium">
            Premium{" "}
            <Badge variant="secondary">
              {
                data.filter(
                  (user: z.infer<typeof schema>) => user.role === "premium"
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="free">
            Free{" "}
            <Badge variant="secondary">
              {
                data.filter(
                  (user: z.infer<typeof schema>) => user.role === "free"
                ).length
              }
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-60"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value={activeTab}
        className="relative flex flex-col gap-4 overflow-auto px-14"
      >
        <div className="overflow-hidden rounded-lg border border-pink-400/30">
          <Table>
            <TableHeader className="bg-pink-300/10 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No users found for this subscription.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-end justify-end px-4">
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function Page() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable />
          </div>
        </div>
      </div>
    </>
  );
}
