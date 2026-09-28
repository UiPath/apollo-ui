// Synthetic IXP demo fixtures for the Solution Tests template. Shapes mirror a
// real run; all names, addresses, and identifiers are made up.

export const IXP_OUTPUT_FIXTURE = {
  status: "success",
  total_files: 3,
  classified_count: 2,
  unclassified_count: 1,
  document_extractions: {
    "demo/boarding_data_sheet.pdf": {
      documentName: "Boarding Data Sheet - 1",
      extractions: [
        {
          fieldGroupName: "Boarding Data Sheet > Borrower Information",
          fieldValues: [
            {
              name: "Borrower Full Name",
              value: "Northwind Traders, LLC",
              confidence: 0.99999964,
              type: "Text",
            },
            {
              name: "Borrower Date of Birth",
              value: null,
              confidence: null,
              type: "Text",
            },
            {
              name: "Borrower Address",
              value: "100 Main St, Suite 200, Springfield, IL 62704",
              confidence: 0.99741644,
              type: "Text",
            },
            {
              name: "Borrower SSN/TIN",
              value: "00-0000000",
              confidence: 0.9999999,
              type: "Text",
            },
          ],
        },
        {
          fieldGroupName: "Boarding Data Sheet > Loan Details",
          fieldValues: [
            {
              name: "Loan Purpose",
              value: null,
              confidence: null,
              type: "Text",
            },
            {
              name: "Collateral Description",
              value: null,
              confidence: null,
              type: "Text",
            },
            {
              name: "Amortization",
              value: null,
              confidence: null,
              type: "Text",
            },
          ],
        },
      ],
    },
    "demo/hazard_insurance_binder.pdf": {
      documentName: "Hazard Insurance Binder - 1",
      extractions: [
        {
          fieldGroupName: "Hazard Insurance Binder > Insurance Details",
          fieldValues: [
            {
              name: "Insured Name",
              value: "Northwind Traders, LLC",
              confidence: 0.9999992,
              type: "Text",
            },
            {
              name: "Effective Date",
              value: "June 16, 2025",
              confidence: 0.9999998,
              type: "Text",
            },
            {
              name: "Mortgagee",
              value:
                "Example Bank, Commercial Lending, 1 Example Plaza, Anytown, ST 00000",
              confidence: 0.84683335,
              type: "Text",
            },
            {
              name: "Insurance Coverage Amount",
              value: null,
              confidence: null,
              type: "Text",
            },
          ],
        },
      ],
    },
    "demo/closing_disclosure.pdf": {
      documentName: "Disbursement Authorization - 1",
      extractions: [
        {
          fieldGroupName: "Document Classification",
          fieldValues: [
            {
              name: "Classification",
              value: "Disbursement Authorization",
              confidence: 0.99999845,
              type: "Text",
            },
          ],
        },
      ],
    },
  },
};

// The new-run taxonomy version is bumped (v2 -> v3) so the provenance
// version-delta glyph shows in the demo.
export const IXP_EVALUATOR_FIXTURE = {
  documents: [
    {
      document: "Deed of Trust",
      status: "compared",
      score: 0.0,
      identical_count: 3,
      total_fields: 9,
      fields: [
        {
          group: "Deed of Trust > Flood Details",
          field: "Flood Notice Date",
          expected: ["within 45 days after notice is given by Lender"],
          actual: [],
          verdict: "different",
          verdict_reason: "value disappeared",
        },
        {
          group: "Deed of Trust > Flood Details",
          field: "Flood Zone",
          expected: ["special flood hazard area"],
          actual: [],
          verdict: "different",
          verdict_reason: "value disappeared",
        },
        {
          group: "Deed of Trust > Insurance Details",
          field: "Insurance Expiration Date",
          expected: ["the expiration date of the policy"],
          actual: [],
          verdict: "different",
          verdict_reason: "value disappeared",
        },
        {
          group: "Deed of Trust > Insurance Details",
          field: "Mortgagee",
          expected: ["Lender"],
          actual: [],
          verdict: "different",
          verdict_reason: "value disappeared",
        },
        {
          group: "Deed of Trust > Party Details",
          field: "Insured Name",
          expected: ["Trustee and Lender being named as additional insureds"],
          actual: [],
          verdict: "different",
          verdict_reason: "value disappeared",
        },
        {
          group: "Deed of Trust > Property Details",
          field: "Covered Structures",
          expected: [
            "all existing or subsequently erected or affixed buildings, improvements and fixtures",
          ],
          actual: [
            "together with all existing or subsequently erected or affixed buildings, improvements and fixtures",
          ],
          verdict: "semantically_same",
          verdict_reason:
            "The new value adds 'together with' but the underlying information about covered structures is the same.",
        },
        {
          group: "Deed of Trust > Flood Details",
          field: "Flood Determination Date",
          expected: [null],
          actual: [],
          verdict: "identical",
          verdict_reason: "",
        },
        {
          group: "Deed of Trust > Flood Details",
          field: "Flood Insurance Coverage Amount",
          expected: [null],
          actual: [],
          verdict: "identical",
          verdict_reason: "",
        },
        {
          group: "Deed of Trust > Flood Details",
          field: "Flood Insurance Effective Date",
          expected: [null],
          actual: [],
          verdict: "identical",
          verdict_reason: "",
        },
      ],
    },
    {
      document: "W-9 - 1",
      status: "compared",
      score: 1.0,
      identical_count: 1,
      total_fields: 2,
      fields: [
        {
          group: "W-9 > Tax Details",
          field: "W-9 Form",
          expected: [
            "Form W-9 (Rev. March 2024) Department of the Treasury Internal Revenue Service Request for Taxpayer Identification Nu...",
          ],
          actual: [
            "Form W-9 (Rev. March 2024) Department of the Treasury Internal Revenue Service Request for Taxpayer Identification Nu...",
          ],
          verdict: "semantically_same",
          verdict_reason:
            "The content is the same but the new value has a slightly different order of sections and minor formatting differences.",
        },
        {
          group: "Document Classification",
          field: "Classification",
          expected: ["W-9"],
          actual: ["W-9"],
          verdict: "identical",
          verdict_reason: "",
        },
      ],
    },
    {
      document: "Hazard Insurance Binder - 1",
      status: "compared",
      score: 1.0,
      identical_count: 3,
      total_fields: 3,
      fields: [
        {
          group: "Document Classification",
          field: "Classification",
          expected: ["Hazard Insurance Binder"],
          actual: ["Hazard Insurance Binder"],
          verdict: "identical",
          verdict_reason: "",
        },
        {
          group: "Hazard Insurance Binder > Insurance Details",
          field: "Agreement to Provide Insurance",
          expected: ["True"],
          actual: ["True"],
          verdict: "identical",
          verdict_reason: "",
        },
        {
          group: "Hazard Insurance Binder > Insurance Details",
          field: "Effective Date",
          expected: ["June 16, 2025"],
          actual: ["June 16, 2025"],
          verdict: "identical",
          verdict_reason: "",
        },
      ],
    },
  ],
  different_field_count: 5,
  semantically_same_field_count: 2,
  identical_field_count: 7,
  expected_provenance: {
    project_name: "example-taxonomy-v3",
    resolved_project_version: 2.0,
    extractor: "gpt_ixp_2",
    tag: "live",
  },
  actual_provenance: {
    project_name: "example-taxonomy-v3",
    resolved_project_version: 3.0,
    extractor: "gpt_ixp_2",
    tag: "live",
  },
};
