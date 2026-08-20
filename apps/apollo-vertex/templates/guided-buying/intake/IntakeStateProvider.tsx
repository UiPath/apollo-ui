"use client";

import { type ReactNode, useState } from "react";
import { IDENTITY, type VendorOption } from "../data";
import {
  type DataInfoValues,
  initialDataInfoValues,
  initialVendor,
  type IntakeState,
  IntakeStateContext,
  journeyAnswersFrom,
  linkedAgreementFor,
} from "./intake-state-context";

export function IntakeStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IntakeState>(() => {
    const lead = initialVendor();
    return {
      selectedVendor: lead.vendor,
      vendorConfirmed: false,
      linkedAgreement: linkedAgreementFor(lead),
      dataInfoValues: initialDataInfoValues(),
      costCentre: IDENTITY.costCentre,
      askText: null,
    };
  });

  const selectVendor = (vendor: VendorOption) => {
    setState((s) => {
      // Clicking the row that's already confirmed un-confirms it, rather
      // than the button being disabled with nothing to click. selectedVendor/
      // linkedAgreement stay put either way, so Review/Submitted still have
      // the lead recommendation to fall back on (see the type's own comment).
      if (s.vendorConfirmed && s.selectedVendor === vendor.vendor) {
        return { ...s, vendorConfirmed: false };
      }
      return {
        ...s,
        selectedVendor: vendor.vendor,
        vendorConfirmed: true,
        linkedAgreement: linkedAgreementFor(vendor),
      };
    });
  };

  const setDataInfoValues = (values: DataInfoValues) => {
    setState((s) => ({ ...s, dataInfoValues: values }));
  };

  const setCostCentre = (value: string) => {
    setState((s) => ({ ...s, costCentre: value }));
  };

  const setAskText = (value: string | null) => {
    setState((s) => ({ ...s, askText: value }));
  };

  return (
    <IntakeStateContext.Provider
      value={{
        ...state,
        selectVendor,
        setDataInfoValues,
        setCostCentre,
        setAskText,
        journeyAnswers: journeyAnswersFrom(state.dataInfoValues),
      }}
    >
      {children}
    </IntakeStateContext.Provider>
  );
}
