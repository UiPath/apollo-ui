import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Filter, MoreHorizontal, Plus, RefreshCw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  createdAt: string;
}

// Sample data
const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    sku: "WH-001",
    category: "Electronics",
    price: 99.99,
    stock: 150,
    status: "active",
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    name: "USB-C Cable",
    sku: "UC-002",
    category: "Accessories",
    price: 12.99,
    stock: 500,
    status: "active",
    createdAt: "2024-01-09",
  },
  {
    id: "3",
    name: "Laptop Stand",
    sku: "LS-003",
    category: "Accessories",
    price: 49.99,
    stock: 75,
    status: "active",
    createdAt: "2024-01-08",
  },
  {
    id: "4",
    name: "Mechanical Keyboard",
    sku: "MK-004",
    category: "Electronics",
    price: 149.99,
    stock: 0,
    status: "draft",
    createdAt: "2024-01-07",
  },
  {
    id: "5",
    name: "Monitor Light Bar",
    sku: "ML-005",
    category: "Electronics",
    price: 59.99,
    stock: 200,
    status: "active",
    createdAt: "2024-01-06",
  },
  {
    id: "6",
    name: "Webcam HD",
    sku: "WC-006",
    category: "Electronics",
    price: 79.99,
    stock: 45,
    status: "active",
    createdAt: "2024-01-05",
  },
  {
    id: "7",
    name: "Mouse Pad XL",
    sku: "MP-007",
    category: "Accessories",
    price: 24.99,
    stock: 300,
    status: "active",
    createdAt: "2024-01-04",
  },
  {
    id: "8",
    name: "Phone Holder",
    sku: "PH-008",
    category: "Accessories",
    price: 19.99,
    stock: 0,
    status: "archived",
    createdAt: "2024-01-03",
  },
  {
    id: "9",
    name: "Bluetooth Speaker",
    sku: "BS-009",
    category: "Electronics",
    price: 39.99,
    stock: 120,
    status: "active",
    createdAt: "2024-01-02",
  },
  {
    id: "10",
    name: "Screen Protector",
    sku: "SP-010",
    category: "Accessories",
    price: 9.99,
    stock: 1000,
    status: "active",
    createdAt: "2024-01-01",
  },
];

const columns: ColumnDef<Product, unknown>[] = [
  DataTableSelectColumn<Product>(),
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.sku}</div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <span className={stock === 0 ? "text-destructive font-medium" : ""}>
          {stock === 0 ? "Out of stock" : stock}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "active" ? "default" : status === "draft" ? "secondary" : "outline"}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function DataManagementTemplate() {
  const [activeTab, setActiveTab] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    if (activeTab !== "all") {
      filtered = filtered.filter((p) => p.status === activeTab);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    return filtered;
  }, [activeTab, categoryFilter]);

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-semibold">Products</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Enter the details for the new product.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product name</Label>
                    <Input id="productName" placeholder="Enter product name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" placeholder="XX-000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Initial stock</Label>
                    <Input id="stock" type="number" placeholder="0" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>Create product</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {/* Tabs and Filters */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All{" "}
                <Badge variant="secondary" className="ml-2">
                  {products.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active">
                Active{" "}
                <Badge variant="secondary" className="ml-2">
                  {products.filter((p) => p.status === "active").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft{" "}
                <Badge variant="secondary" className="ml-2">
                  {products.filter((p) => p.status === "draft").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived{" "}
                <Badge variant="secondary" className="ml-2">
                  {products.filter((p) => p.status === "archived").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchKey="name"
          searchPlaceholder="Search products..."
          resizable
          compact
        />
      </main>
    </div>
  );
}
