import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@multisystem/ui";
import { PageFrame } from "@/views/PageFrame";
import { StatsCards } from "@/components/features/reports/StatsCards";
import { DailySalesChart } from "@/components/features/reports/DailySalesChart";
import { TopProductsTable } from "@/components/features/reports/TopProductsTable";
import { ProductPanel } from "@/components/features/pos/ProductPanel";
import { ShoppingCart } from "@/components/features/pos/ShoppingCart";
import { TotalsPanel } from "@/components/features/pos/TotalsPanel";
import { PaymentModal } from "@/components/features/pos/PaymentModal";
import { ReceiptModal } from "@/components/features/pos/ReceiptModal";
import { CustomerSelector } from "@/components/features/pos/CustomerSelector";
import { StoreSelector } from "@/components/features/pos/StoreSelector";
import { ProductForm } from "@/components/features/products/ProductForm";
import { CustomerForm } from "@/components/features/customers/CustomerForm";
import { SupplierForm } from "@/components/features/suppliers/SupplierForm";
import { UserForm } from "@/components/features/users/UserForm";
import { InventoryOverview } from "@/components/features/inventory/InventoryOverview";
import { InventoryAdjustmentForm } from "@/components/features/inventory/InventoryAdjustmentForm";
import { LowStockAlert } from "@/components/features/inventory/LowStockAlert";
import { StoreConfigForm } from "@/components/features/store-config/StoreConfigForm";
import { TicketConfigForm } from "@/components/features/settings/TicketConfigForm";
import { CreateBackupButton } from "@/components/features/backup/CreateBackupButton";
import { RestoreBackupDialog } from "@/components/features/backup/RestoreBackupDialog";
import { BackupList } from "@/components/features/backup/BackupList";
import { useStoreContextOptional } from "@/components/providers/StoreContext";
import { useInventoryStats } from "@/hooks/useReports";
import { useStoreConfig, useUpdateStoreConfig } from "@/hooks/useStoreConfig";
import { useTicketConfig, useUpdateTicketConfig } from "@/hooks/useTicketConfig";
import { useCreateProduct, useProduct, useUpdateProduct, useProducts } from "@/hooks/useProducts";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useCreateCustomer, useCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { useCreateSupplier, useSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";
import { useCreateUser, useUser, useUpdateUser } from "@/hooks/useUsers";
import { useLoyaltyConfig, useUpdateLoyaltyConfig } from "@/hooks/useLoyalty";
import { useStoreConfig as usePosStoreConfig } from "@/hooks/useStoreConfig";
import { authApi } from "@/lib/api/client";

export function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const storeContext = useStoreContextOptional();
  const storeId = storeContext?.reportStoreId ?? storeContext?.currentStoreId ?? undefined;
  return (
    <PageFrame title="Dashboard">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant={period === "today" ? "default" : "outline"} onClick={() => setPeriod("today")}>Hoy</Button>
          <Button size="sm" variant={period === "week" ? "default" : "outline"} onClick={() => setPeriod("week")}>Semana</Button>
          <Button size="sm" variant={period === "month" ? "default" : "outline"} onClick={() => setPeriod("month")}>Mes</Button>
        </div>
        <StatsCards period={period} storeId={storeId} />
        <DailySalesChart days={period === "today" ? 7 : period === "week" ? 30 : 90} storeId={storeId} />
        <TopProductsTable storeId={storeId} />
      </div>
    </PageFrame>
  );
}

export function POSPage() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const { data: storeConfig } = usePosStoreConfig();
  return (
    <PageFrame title="Punto de Venta">
      <div className="h-[calc(100vh-12rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">POS</h2>
          <StoreSelector />
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
          <div className="lg:col-span-5 overflow-hidden"><ProductPanel /></div>
          <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
            <CustomerSelector />
            <div className="flex-1 min-h-0"><ShoppingCart /></div>
            <TotalsPanel onCheckout={() => setPaymentModalOpen(true)} taxRate={storeConfig?.taxRate || 0} />
          </div>
        </div>
      </div>
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={(saleId) => {
          setCompletedSaleId(saleId);
          setReceiptModalOpen(true);
        }}
      />
      <ReceiptModal
        saleId={completedSaleId}
        open={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setCompletedSaleId(null);
        }}
      />
    </PageFrame>
  );
}

export function CategoriesPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { data = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  return (
    <PageFrame title="Categorias">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Nueva categoria</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripcion" />
            <Button
              onClick={async () => {
                if (!name.trim()) return;
                await createMutation.mutateAsync({ name: name.trim(), description: description || undefined });
                setName("");
                setDescription("");
              }}
              disabled={createMutation.isPending}
            >
              Crear
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <p>Cargando...</p> : data.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.description || "Sin descripcion"}</p>
                </div>
                <Button variant="outline" onClick={() => deleteMutation.mutate(c.id)}>Eliminar</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

function CrudGuard({ children, loading, notFound }: { children: React.ReactNode; loading: boolean; notFound: boolean }) {
  if (loading) return <PageFrame title="Cargando"><p>Cargando...</p></PageFrame>;
  if (notFound) return <PageFrame title="No encontrado"><p>Registro no encontrado.</p></PageFrame>;
  return <>{children}</>;
}

export function ProductCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateProduct();
  return <PageFrame title="Nuevo Producto"><ProductForm onSubmit={async (data) => { await mutation.mutateAsync(data as any); navigate("/products"); }} isLoading={mutation.isPending} /></PageFrame>;
}
export function ProductEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProduct(id);
  const mutation = useUpdateProduct();
  return <CrudGuard loading={isLoading} notFound={!data}><PageFrame title="Editar Producto"><ProductForm initialData={data as any} onSubmit={async (form) => { await mutation.mutateAsync({ id, data: form as any }); navigate("/products"); }} isLoading={mutation.isPending} /></PageFrame></CrudGuard>;
}
export function CustomerCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateCustomer();
  return <PageFrame title="Nuevo Cliente"><CustomerForm onSubmit={async (data) => { await mutation.mutateAsync(data as any); navigate("/customers"); }} isLoading={mutation.isPending} /></PageFrame>;
}
export function CustomerEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useCustomer(id);
  const mutation = useUpdateCustomer();
  return <CrudGuard loading={isLoading} notFound={!data}><PageFrame title="Editar Cliente"><CustomerForm initialData={data as any} onSubmit={async (form) => { await mutation.mutateAsync({ id, data: form as any }); navigate("/customers"); }} isLoading={mutation.isPending} /></PageFrame></CrudGuard>;
}
export function SupplierCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateSupplier();
  return <PageFrame title="Nuevo Proveedor"><SupplierForm onSubmit={async (data) => { await mutation.mutateAsync(data as any); navigate("/suppliers"); }} isLoading={mutation.isPending} /></PageFrame>;
}
export function SupplierEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSupplier(id);
  const mutation = useUpdateSupplier();
  return <CrudGuard loading={isLoading} notFound={!data}><PageFrame title="Editar Proveedor"><SupplierForm initialData={data as any} onSubmit={async (form) => { await mutation.mutateAsync({ id, data: form as any }); navigate("/suppliers"); }} isLoading={mutation.isPending} /></PageFrame></CrudGuard>;
}
export function UserCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateUser();
  return <PageFrame title="Nuevo Usuario"><UserForm onSubmit={async (data) => { await mutation.mutateAsync(data as any); navigate("/admin/users"); }} isLoading={mutation.isPending} /></PageFrame>;
}
export function UserEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useUser(id);
  const mutation = useUpdateUser();
  return <CrudGuard loading={isLoading} notFound={!data}><PageFrame title="Editar Usuario"><UserForm isEdit initialData={data as any} onSubmit={async (form) => { await mutation.mutateAsync({ id, data: form as any }); navigate("/admin/users"); }} isLoading={mutation.isPending} /></PageFrame></CrudGuard>;
}

export function ReportsPage() {
  return (
    <PageFrame title="Reportes">
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Ventas</CardTitle><CardDescription>Indicadores de ventas y top productos.</CardDescription></CardHeader><CardContent><Link to="/reports/sales"><Button variant="outline">Ver reporte de ventas</Button></Link></CardContent></Card>
        <Card><CardHeader><CardTitle>Inventario</CardTitle><CardDescription>Vista de stock y productos criticos.</CardDescription></CardHeader><CardContent><Link to="/reports/inventory"><Button variant="outline">Ver reporte de inventario</Button></Link></CardContent></Card>
      </div>
    </PageFrame>
  );
}
export function ReportsSalesPage() {
  const storeContext = useStoreContextOptional();
  const storeId = storeContext?.reportStoreId ?? storeContext?.currentStoreId ?? undefined;
  return <PageFrame title="Reporte de Ventas"><div className="space-y-4"><StatsCards period="month" storeId={storeId} /><DailySalesChart days={30} storeId={storeId} /><TopProductsTable storeId={storeId} /></div></PageFrame>;
}
export function ReportsInventoryPage() {
  const storeContext = useStoreContextOptional();
  const storeId = storeContext?.reportStoreId ?? storeContext?.currentStoreId ?? undefined;
  const { data } = useInventoryStats(storeId);
  return (
    <PageFrame title="Reporte de Inventario">
      <div className="space-y-6">
        <InventoryOverview />
        <Card>
          <CardHeader><CardTitle>Productos con stock</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.products ?? []).map((p) => <div key={p.id} className="flex justify-between border-b py-2 text-sm"><span>{p.name}</span><span>Stock: {p.stock}</span></div>)}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

export function InventoryLowStockPage() {
  return <PageFrame title="Stock Bajo"><LowStockAlert /></PageFrame>;
}
export function InventoryAdjustmentsPage() {
  const { data } = useProducts();
  const first = useMemo(() => (Array.isArray(data) && data.length > 0 ? data[0] : null), [data]);
  return (
    <PageFrame title="Ajustes de Inventario">
      {!first ? <p>No hay productos para ajustar.</p> : <InventoryAdjustmentForm productId={first.id} currentStock={first.stock ?? 0} onSubmit={async () => Promise.resolve()} />}
    </PageFrame>
  );
}

export function AdminSettingsPage() {
  const { data: storeConfig } = useStoreConfig();
  const { data: ticketConfig } = useTicketConfig();
  const updateStore = useUpdateStoreConfig();
  const updateTicket = useUpdateTicketConfig();
  if (!storeConfig || !ticketConfig) return <PageFrame title="Configuracion"><p>Cargando...</p></PageFrame>;
  return (
    <PageFrame title="Configuracion">
      <div className="space-y-8">
        <Card><CardHeader><CardTitle>Configuracion de tienda</CardTitle></CardHeader><CardContent><StoreConfigForm initialData={storeConfig as any} onSubmit={async (d) => { await updateStore.mutateAsync(d); }} isLoading={updateStore.isPending} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Configuracion de ticket</CardTitle></CardHeader><CardContent><TicketConfigForm initialData={ticketConfig as any} onSubmit={async (d) => { await updateTicket.mutateAsync(d); }} isLoading={updateTicket.isPending} /></CardContent></Card>
      </div>
    </PageFrame>
  );
}
export function LoyaltyPage() {
  const { data } = useLoyaltyConfig();
  const update = useUpdateLoyaltyConfig();
  const [pointsPerDollar, setPointsPerDollar] = useState("1");
  const [redemptionRate, setRedemptionRate] = useState("0.01");
  return (
    <PageFrame title="Lealtad">
      <Card>
        <CardHeader><CardTitle>Configuracion de puntos</CardTitle><CardDescription>Alineado con `/api/shopflow/loyalty/config`.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {data ? <pre className="text-xs bg-slate-100 p-3 rounded">{JSON.stringify(data, null, 2)}</pre> : null}
          <div><Label>Puntos por compra</Label><Input value={pointsPerDollar} onChange={(e) => setPointsPerDollar(e.target.value)} /></div>
          <div><Label>Factor redencion</Label><Input value={redemptionRate} onChange={(e) => setRedemptionRate(e.target.value)} /></div>
          <Button onClick={() => update.mutate({ pointsPerDollar: Number(pointsPerDollar), redemptionRate: Number(redemptionRate) })} disabled={update.isPending}>Guardar</Button>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
export function BackupPage() {
  return (
    <PageFrame title="Copias de Seguridad">
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>Gestion de backups</CardTitle><CardDescription>Si el backend no expone `/api/shopflow/backup/*`, esta pagina mostrara errores de API.</CardDescription></CardHeader><CardContent className="flex gap-2"><CreateBackupButton /><RestoreBackupDialog /></CardContent></Card>
        <BackupList />
      </div>
    </PageFrame>
  );
}

export function AccountPage() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try { await authApi.post("/logout"); } catch {}
    navigate("/login", { replace: true });
  };
  return (
    <PageFrame title="Mi Cuenta">
      <Card>
        <CardHeader><CardTitle>Sesion</CardTitle><CardDescription>Gestion de sesion y datos de usuario.</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={handleLogout}>Cerrar sesion</Button></CardContent>
      </Card>
    </PageFrame>
  );
}
