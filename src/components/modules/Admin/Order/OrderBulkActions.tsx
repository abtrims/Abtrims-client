"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CreditCard, Loader2, Package, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  bulkAssignCourier,
  bulkDeleteOrders,
  bulkUpdateOrderStatus,
  bulkUpdatePaymentStatus,
} from "@/services/order.services";
import { getCourierSettings } from "@/services/courierSetting.services";
import { COURIER_LABEL, IOrder, OrderStatus, PaymentStatus } from "@/types/order.types";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_COURIER",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

type BulkAction =
  | { type: "status"; value: OrderStatus }
  | { type: "payment"; value: PaymentStatus }
  | { type: "courier"; value: "PATHAO" | "STEADFAST" }
  | { type: "delete" };

const ACTION_TEXT = (action: BulkAction, count: number) => {
  const orders = `${count} order${count > 1 ? "s" : ""}`;
  switch (action.type) {
    case "status":
      return {
        title: `Change order status to ${action.value.replace("_", " ")}?`,
        description: `${orders} will be updated. Customers get the status SMS like a single update.`,
      };
    case "payment":
      return {
        title: `Change payment status to ${action.value}?`,
        description: `${orders} will be updated.`,
      };
    case "courier":
      return {
        title: `Assign to ${COURIER_LABEL[action.value]}?`,
        description: `${orders} will be sent to ${COURIER_LABEL[action.value]} and moved to IN COURIER. Orders already assigned to a courier are skipped.`,
      };
    case "delete":
      return {
        title: `Delete ${orders}?`,
        description:
          "This action cannot be undone. Usually, it is better to set the status to CANCELLED instead.",
      };
  }
};

interface OrderBulkActionsProps {
  selectedOrders: IOrder[];
  onClearSelection: () => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function OrderBulkActions({
  selectedOrders,
  onClearSelection,
  canUpdate,
  canDelete,
}: OrderBulkActionsProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [enabledCouriers, setEnabledCouriers] = useState<{
    pathao: boolean;
    steadfast: boolean;
  } | null>(null);

  const count = selectedOrders.length;

  useEffect(() => {
    if (!canUpdate) return;
    getCourierSettings()
      .then((res) => {
        if (res.data) {
          setEnabledCouriers({
            pathao: res.data.pathaoEnabled,
            steadfast: res.data.steadfastEnabled,
          });
        }
      })
      .catch(() => setEnabledCouriers({ pathao: false, steadfast: false }));
  }, [canUpdate]);

  if (count === 0) return null;

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const ids = selectedOrders.map((o) => o.id);
    setLoading(true);
    try {
      const res =
        pendingAction.type === "status"
          ? await bulkUpdateOrderStatus(ids, pendingAction.value)
          : pendingAction.type === "payment"
            ? await bulkUpdatePaymentStatus(ids, pendingAction.value)
            : pendingAction.type === "courier"
              ? await bulkAssignCourier(ids, pendingAction.value)
              : await bulkDeleteOrders(ids);

      if (!res?.success) {
        toast.error(res?.message || "Bulk action failed");
        return;
      }

      const failed: { id: string; message: string }[] = res.data?.failed ?? [];
      if (failed.length === 0) {
        toast.success(res.message);
      } else {
        // Name the failed orders so the admin can fix them one by one
        const orderNo = (id: string) =>
          selectedOrders.find((o) => o.id === id)?.orderNumber ?? id.slice(0, 8);
        toast.warning(res.message, {
          description: failed
            .slice(0, 5)
            .map((f) => `#${orderNo(f.id)}: ${f.message}`)
            .join("\n"),
          duration: 10000,
        });
      }

      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClearSelection();
      setPendingAction(null);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const text = pendingAction ? ACTION_TEXT(pendingAction, count) : null;
  const hasCourier = enabledCouriers?.pathao || enabledCouriers?.steadfast;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <span className="text-sm font-semibold">{count} selected</span>
        <button
          type="button"
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canUpdate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                  <Package className="size-4" /> Order Status <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Set order status</DropdownMenuLabel>
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setPendingAction({ type: "status", value: opt })}
                  >
                    {opt.replace("_", " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canUpdate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                  <CreditCard className="size-4" /> Payment Status <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Set payment status</DropdownMenuLabel>
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setPendingAction({ type: "payment", value: opt })}
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canUpdate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                  <Truck className="size-4" /> Assign Courier <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Send to courier</DropdownMenuLabel>
                {!enabledCouriers ? (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : !hasCourier ? (
                  <DropdownMenuItem disabled>No courier is active</DropdownMenuItem>
                ) : (
                  <>
                    {enabledCouriers.pathao && (
                      <DropdownMenuItem
                        onClick={() => setPendingAction({ type: "courier", value: "PATHAO" })}
                      >
                        Pathao
                      </DropdownMenuItem>
                    )}
                    {enabledCouriers.steadfast && (
                      <DropdownMenuItem
                        onClick={() => setPendingAction({ type: "courier", value: "STEADFAST" })}
                      >
                        Steadfast
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {/* RedX needs a delivery area per order */}
                <DropdownMenuItem disabled className="text-xs">
                  RedX: assign from each order&apos;s Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => setPendingAction({ type: "delete" })}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !loading) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">{text?.title}</AlertDialogTitle>
            <AlertDialogDescription>{text?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold" disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                pendingAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
                  : "rounded-xl font-bold"
              }
              onClick={(e) => {
                // Keep the dialog open until the request finishes
                e.preventDefault();
                void handleConfirm();
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {loading ? "Working..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
