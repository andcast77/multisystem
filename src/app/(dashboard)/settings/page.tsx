"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/useUser";
import { useCompany } from "@/hooks/useCompany";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  AlertDescription,
  Alert,
} from "@multisystem/ui";
import { updateCompanySchema, companyFiscalSchema, type UpdateCompanyInput, type CompanyFiscalInput } from "@/lib/validations/company";
import { companyApi } from "@/lib/api-client";
import { DeleteCompanyDialog } from "@/components/features/DeleteCompanyDialog";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { data: company } = useCompany(user?.companyId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isOwner = user?.membershipRole === "OWNER";

  // Form for general company info
  const generalForm = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: company?.name || "",
    },
  });

  // Form for fiscal data
  const fiscalForm = useForm<CompanyFiscalInput>({
    resolver: zodResolver(companyFiscalSchema),
    defaultValues: {
      taxId: company?.taxId || "",
      address: company?.address || "",
      phone: company?.phone || "",
    },
  });

  const handleGeneralSubmit = async (data: UpdateCompanyInput) => {
    if (!company) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await companyApi.updateCompany(company.id, data);
      if (response.success) {
        setSuccessMessage("Información de la empresa actualizada");
        await queryClient.invalidateQueries({ queryKey: ["company", company.id] });
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrorMessage(response.error || "Error al actualizar la empresa");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Error al actualizar la empresa");
    }
  };

  const handleFiscalSubmit = async (data: CompanyFiscalInput) => {
    if (!company) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await companyApi.updateCompany(company.id, data);
      if (response.success) {
        setSuccessMessage("Datos fiscales actualizados");
        await queryClient.invalidateQueries({ queryKey: ["company", company.id] });
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrorMessage(response.error || "Error al actualizar los datos");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Error al actualizar los datos");
    }
  };

  const handleModulesChange = async (moduleName: string, enabled: boolean) => {
    if (!company || !isOwner) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updateData: UpdateCompanyInput = {};
      if (moduleName === "workify") updateData.workifyEnabled = enabled;
      else if (moduleName === "shopflow") updateData.shopflowEnabled = enabled;
      else if (moduleName === "techServices") updateData.technicalServicesEnabled = enabled;

      const response = await companyApi.updateCompany(company.id, updateData);
      if (response.success) {
        setSuccessMessage(`Módulo ${moduleName} ${enabled ? "activado" : "desactivado"}`);
        await queryClient.invalidateQueries({ queryKey: ["company", company.id] });
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrorMessage(response.error || "Error al cambiar el módulo");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Error al cambiar el módulo");
    }
  };

  if (!company || !user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración de Empresa</h1>
        <p className="text-slate-600 mt-1">Gestiona los ajustes y datos de tu empresa</p>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="bg-red-50 border border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="fiscal">Datos Fiscales</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Empresa</Label>
                  <Input
                    id="name"
                    placeholder="Mi Empresa"
                    {...generalForm.register("name")}
                  />
                  {generalForm.formState.errors.name && (
                    <p className="text-sm text-red-600">{generalForm.formState.errors.name.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={generalForm.formState.isSubmitting}>
                  {generalForm.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Módulos de la Empresa</CardTitle>
              <CardDescription>Activa o desactiva los módulos disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              {!isOwner && (
                <Alert className="mb-4 bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Solo el propietario puede cambiar la configuración de módulos
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Workify Module */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Workify</h4>
                    <p className="text-sm text-slate-600">Gestión de recursos humanos y nómina</p>
                  </div>
                  <Switch
                    checked={company.workifyEnabled}
                    onCheckedChange={(checked) => handleModulesChange("workify", checked)}
                    disabled={!isOwner}
                  />
                </div>

                {/* Shopflow Module */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Shopflow</h4>
                    <p className="text-sm text-slate-600">Punto de venta e inventario</p>
                  </div>
                  <Switch
                    checked={company.shopflowEnabled}
                    onCheckedChange={(checked) => handleModulesChange("shopflow", checked)}
                    disabled={!isOwner}
                  />
                </div>

                {/* TechServices Module */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Tech Services</h4>
                    <p className="text-sm text-slate-600">Gestión de servicios técnicos</p>
                  </div>
                  <Switch
                    checked={company.technicalServicesEnabled}
                    onCheckedChange={(checked) => handleModulesChange("techServices", checked)}
                    disabled={!isOwner}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiscal Tab */}
        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Datos Fiscales</CardTitle>
              <CardDescription>Información legal y de contacto de la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={fiscalForm.handleSubmit(handleFiscalSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">RFC / Tax ID</Label>
                  <Input
                    id="taxId"
                    placeholder="RFC o número de identificación fiscal"
                    {...fiscalForm.register("taxId")}
                  />
                  {fiscalForm.formState.errors.taxId && (
                    <p className="text-sm text-red-600">{fiscalForm.formState.errors.taxId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Calle 123, Ciudad, CP 12345"
                    {...fiscalForm.register("address")}
                  />
                  {fiscalForm.formState.errors.address && (
                    <p className="text-sm text-red-600">{fiscalForm.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+34 123 456 789"
                    {...fiscalForm.register("phone")}
                  />
                  {fiscalForm.formState.errors.phone && (
                    <p className="text-sm text-red-600">{fiscalForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={fiscalForm.formState.isSubmitting}>
                  {fiscalForm.formState.isSubmitting ? "Guardando..." : "Guardar datos fiscales"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>Configuraciones generales de la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-50 border border-blue-200 mb-4">
                <AlertDescription className="text-blue-800">
                  Las preferencias avanzadas estarán disponibles próximamente
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      {isOwner && (
        <div className="border-t pt-6">
          <Card className="border border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
              <CardDescription>Acciones irreversibles que afectarán permanentemente a la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-100/50 rounded-lg border border-red-200">
                  <h4 className="font-medium mb-2">Eliminar Empresa</h4>
                  <p className="text-sm text-red-900 mb-4">
                    Una vez eliminada, la empresa y todos sus datos (usuarios, productos, ventas, etc.) se perderán permanentemente.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Eliminar Empresa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DeleteCompanyDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        companyId={company.id}
        companyName={company.name}
      />
    </div>
  );
}
