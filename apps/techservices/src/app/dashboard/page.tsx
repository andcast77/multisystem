"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { techServicesApi, type ApiResponse } from "@/lib/api/client";

type WorkOrder = { id: string; status: string };
type Asset = { id: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [openOrders, setOpenOrders] = useState(0);
  const [scheduledVisits, setScheduledVisits] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const ordersResponse = await techServicesApi.get<
        ApiResponse<WorkOrder[]> & { pagination?: { total: number } }
      >("/work-orders?page=1&limit=200");
      const assetsResponse = await techServicesApi.get<ApiResponse<Asset[]>>("/assets");

      if (ordersResponse.success && ordersResponse.data) {
        const open = ordersResponse.data.filter((o: WorkOrder) => o.status === "OPEN").length;
        setOpenOrders(open);
        setScheduledVisits(
          ordersResponse.data.filter((o: WorkOrder) => o.status === "IN_PROGRESS" || o.status === "ON_HOLD").length
        );
      }
      if (assetsResponse.success && assetsResponse.data) {
        setAssetsCount(assetsResponse.data.length);
      }
    };

    loadStats()
      .catch(() => {
        setOpenOrders(0);
        setScheduledVisits(0);
        setAssetsCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Panel general</h1>
          <p className="text-slate-600">Resumen rapido de ordenes y visitas.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Ordenes abiertas</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? "--" : openOrders}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Visitas activas</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? "--" : scheduledVisits}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Activos registrados</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? "--" : assetsCount}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
