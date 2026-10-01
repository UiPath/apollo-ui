/**
 * EXAMPLE ADAPTER. Not shipped: it shows how a solution (shipment tracking)
 * maps its own data into the key facts view model. Adapters belong to
 * solutions.
 */
import type { KeyFactsViewModel } from "../key-facts.view-model";

interface Shipment {
  trackingNumber: string;
  carrier: string;
  status: "in_transit" | "delivered" | "held";
  eta?: string;
  weightKg: number;
}

const STATUS: Record<Shipment["status"], string> = {
  in_transit: "In transit",
  delivered: "Delivered",
  held: "Held at customs",
};

export function shipmentToKeyFacts(shipment: Shipment): KeyFactsViewModel {
  return {
    subject: shipment.trackingNumber,
    facts: [
      { id: "status", label: "Status", value: STATUS[shipment.status] },
      { id: "carrier", label: "Carrier", value: shipment.carrier },
      {
        id: "eta",
        label: "Arrives",
        ...(shipment.eta && { value: shipment.eta }),
      },
      { id: "weight", label: "Weight", value: `${shipment.weightKg} kg` },
    ],
  };
}

export const SHIPMENT = shipmentToKeyFacts({
  trackingNumber: "SHP-77310",
  carrier: "Northline Freight",
  status: "held",
  eta: "Oct 2, 2026",
  weightKg: 412,
});
