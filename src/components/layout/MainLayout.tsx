"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("maz_auth");
    if (auth !== "true") {
      router.push("/login");
      return;
    }
    void (async () => {
      try {
        const data = await apiFetch("/alertas/");

        if (Array.isArray(data)) {
          const alertasPago = data.filter((alerta) =>
            ["pago_proximo", "pago_hoy", "pago_vencido", "pago_pendiente"].includes(alerta.tipo_alerta)
          );

          setAlertCount(alertasPago.length);
        }
      } catch (error) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Sidebar
        isCollapsed={collapsed}
        setIsCollapsed={setCollapsed}
        alertCount={alertCount}
      />
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${collapsed ? "ml-32" : "ml-80"
          }`}
      >
        <div className="sticky top-0 z-30 bg-[#F6F8FB] px-6 pt-6 pb-2">
          <Header
            isCollapsed={collapsed}
            toggleCollapsed={() => setCollapsed((c) => !c)}
            alertCount={alertCount}
          />
        </div>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}