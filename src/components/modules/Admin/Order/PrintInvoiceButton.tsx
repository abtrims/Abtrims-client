"use client";

import { useQueryClient } from "@tanstack/react-query";
import { HandCoins, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/services/siteSetting.services";
import {
  printOrderChallan,
  printOrderInvoice,
  printOrderMoneyReceipt,
} from "@/lib/printOrderInvoice";
import { IOrder } from "@/types/order.types";

const PRINTERS = {
  invoice: printOrderInvoice,
  challan: printOrderChallan,
  receipt: printOrderMoneyReceipt,
};

// Invoice, challan and money receipt printer buttons for one order row; loads
// the company details once and reuses them
export default function PrintInvoiceButton({ order }: { order: IOrder }) {
  const queryClient = useQueryClient();

  const handlePrint = async (kind: keyof typeof PRINTERS) => {
    const siteSettings = await queryClient
      .fetchQuery({
        queryKey: ["site-settings"],
        queryFn: () => getSiteSettings().then((res) => res.data),
        staleTime: 10 * 60 * 1000,
      })
      .catch(() => null);
    PRINTERS[kind](order, siteSettings);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => handlePrint("invoice")}
        title="Print A4 invoice"
        className="h-8 gap-1.5 rounded-lg border-primary/40 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
      >
        <Printer className="size-4" />
        Print
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => handlePrint("challan")}
        title="Print A4 delivery challan (no prices)"
        className="h-8 gap-1.5 rounded-lg font-semibold"
      >
        <Truck className="size-4" />
        Challan
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => handlePrint("receipt")}
        title="Print A4 money receipt"
        className="h-8 gap-1.5 rounded-lg font-semibold"
      >
        <HandCoins className="size-4" />
        Receipt
      </Button>
    </>
  );
}
