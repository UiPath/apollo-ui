import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

/**
 * The canonical display copy for the built-in guardrail validators.
 *
 * Until now this table lived twice, once in each product, and the two drifted. Here it is a
 * set of lingui messages in the shared canvas catalog, so both hosts get the same wording and
 * the same translations, and the strings sit in the real localization pipeline instead of a
 * host-side constant.
 *
 * Message ids follow the family's dotted convention:
 *
 * ```
 * guardrails.definitions.<validator>.display-name
 * guardrails.definitions.<validator>.description
 * guardrails.definitions.<validator>.usage-note
 * guardrails.definitions.<validator>.param.<paramId>.label
 * guardrails.definitions.<validator>.param.<paramId>.tooltip
 * guardrails.definitions.<validator>.option.<paramId>.<RawWireValue>
 * ```
 *
 * Validator, parameter and option segments are the **raw wire values**
 * (`pii_detection`, `entityThresholds`, `USSocialSecurityNumber`), never a transcribed slug.
 * Transcribing is how the two products ended up keying the same Finland entity as
 * `finNationalId` and `fiNationalId`.
 *
 * One builder holds every message, so the English source, the flat record hosts diff in CI
 * and the runtime lingui path cannot drift. Nothing here is extracted: `src/canvas` uses no
 * lingui macros, and `locales/en.json` is hand-authored against this builder and pinned by
 * `definitions-parity.test.ts` (see `__fixtures__/catalog-coverage.ts`). Where the two
 * products' English differed, the choice and its reason are recorded in that same test.
 */

/** Curated copy for one validator. Absent entries fall back to the wire, then to the id. */
export interface GuardrailValidatorCopy {
  displayName: string;
  description: string;
  /** Informational note rendered above the form, e.g. a cost caveat. */
  usageNote?: string;
  /** Keyed by raw parameter id. */
  paramLabels: Record<string, string>;
  /** Keyed by raw parameter id. */
  paramTooltips?: Record<string, string>;
  /** Keyed by raw parameter id, then by raw wire option value. */
  optionLabels?: Record<string, Record<string, string>>;
}

/** Curated copy keyed by raw validator id. */
export type GuardrailCopyTable = Record<string, GuardrailValidatorCopy>;

/** The subset of `useSafeLingui`'s translator this module needs. */
type CopyTranslate = (descriptor: { id: string; message: string }) => string;

function buildGuardrailCopy(_: CopyTranslate): GuardrailCopyTable {
  return {
    pii_detection: {
      displayName: _({
        id: 'guardrails.definitions.pii_detection.display-name',
        message: 'PII detection',
      }),
      description: _({
        id: 'guardrails.definitions.pii_detection.description',
        message: 'Detect personally identifiable information using Azure Cognitive Services.',
      }),
      paramLabels: {
        entities: _({
          id: 'guardrails.definitions.pii_detection.param.entities.label',
          message: 'Entities to detect',
        }),
        entityThresholds: _({
          id: 'guardrails.definitions.pii_detection.param.entityThresholds.label',
          message: 'Detection thresholds',
        }),
      },
      paramTooltips: {
        entityThresholds: _({
          id: 'guardrails.definitions.pii_detection.param.entityThresholds.tooltip',
          message:
            'Value between 0 and 1. The sensitivity level for PII detection. Higher thresholds detect more potential PII but may result in more false positives.',
        }),
      },
      optionLabels: {
        entities: {
          Person: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Person',
            message: 'Person',
          }),
          Address: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Address',
            message: 'Address',
          }),
          Date: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Date',
            message: 'Date',
          }),
          PhoneNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PhoneNumber',
            message: 'Phone Number',
          }),
          EugpsCoordinates: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EugpsCoordinates',
            message: 'EU GPS Coordinates',
          }),
          Email: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Email',
            message: 'Email',
          }),
          CreditCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CreditCardNumber',
            message: 'Credit Card Number',
          }),
          InternationalBankingAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.InternationalBankingAccountNumber',
            message: 'International Banking Account Number (IBAN)',
          }),
          SwiftCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SwiftCode',
            message: 'SWIFT Code',
          }),
          ABARoutingNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ABARoutingNumber',
            message: 'ABA Routing Number',
          }),
          USDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USDriversLicenseNumber',
            message: "US Driver's License Number",
          }),
          UKDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKDriversLicenseNumber',
            message: "UK Driver's License Number",
          }),
          USIndividualTaxpayerIdentification: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USIndividualTaxpayerIdentification',
            message: 'US Individual Taxpayer Identification Number (ITIN)',
          }),
          UKUniqueTaxpayerNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKUniqueTaxpayerNumber',
            message: 'UK Unique Taxpayer Number (UTR)',
          }),
          USBankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USBankAccountNumber',
            message: 'US Bank Account Number',
          }),
          USSocialSecurityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USSocialSecurityNumber',
            message: 'US Social Security Number (SSN)',
          }),
          UsukPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UsukPassportNumber',
            message: 'US/UK Passport Number',
          }),
          NOIdentityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NOIdentityNumber',
            message: 'Norway Identity Number',
          }),
          FINationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FINationalID',
            message: 'Finland National ID',
          }),
          FIPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FIPassportNumber',
            message: 'Finland Passport Number',
          }),
          SENationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SENationalID',
            message: 'Sweden National ID',
          }),
          DKPersonalIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DKPersonalIdentificationNumber',
            message: 'Danish Personal Identification Number',
          }),
          NLCitizensServiceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NLCitizensServiceNumber',
            message: 'Netherlands Citizens Service Number',
          }),
          URL: _({
            id: 'guardrails.definitions.pii_detection.option.entities.URL',
            message: 'URL',
          }),
          IPAddress: _({
            id: 'guardrails.definitions.pii_detection.option.entities.IPAddress',
            message: 'IP Address',
          }),
          // The preview entities Agents offers behind EnablePreviewPiiEntities (AL-625).
          Age: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Age',
            message: 'Age',
          }),
          Organization: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Organization',
            message: 'Organization',
          }),
          AzureDocumentDBAuthKey: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureDocumentDBAuthKey',
            message: 'Azure Document DB Auth Key',
          }),
          AzureIAASDatabaseConnectionAndSQLString: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureIAASDatabaseConnectionAndSQLString',
            message: 'Azure IaaS Database Connection and SQL String',
          }),
          AzureIoTConnectionString: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureIoTConnectionString',
            message: 'Azure IoT Connection String',
          }),
          AzurePublishSettingPassword: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzurePublishSettingPassword',
            message: 'Azure Publish Setting Password',
          }),
          AzureRedisCacheString: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureRedisCacheString',
            message: 'Azure Redis Cache String',
          }),
          AzureSAS: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureSAS',
            message: 'Azure SAS',
          }),
          AzureServiceBusString: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureServiceBusString',
            message: 'Azure Service Bus String',
          }),
          AzureStorageAccountGeneric: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureStorageAccountGeneric',
            message: 'Azure Storage Account Generic',
          }),
          AzureStorageAccountKey: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AzureStorageAccountKey',
            message: 'Azure Storage Account Key',
          }),
          SQLServerConnectionString: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SQLServerConnectionString',
            message: 'SQL Server Connection String',
          }),
          ARNationalIdentityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ARNationalIdentityNumber',
            message: 'Argentina National Identity Number',
          }),
          AUBankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUBankAccountNumber',
            message: 'Australia Bank Account Number',
          }),
          AUBusinessNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUBusinessNumber',
            message: 'Australia Business Number',
          }),
          AUCompanyNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUCompanyNumber',
            message: 'Australia Company Number',
          }),
          AUDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUDriversLicenseNumber',
            message: "Australia Driver's License Number",
          }),
          AUMedicalAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUMedicalAccountNumber',
            message: 'Australia Medical Account Number',
          }),
          AUPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUPassportNumber',
            message: 'Australia Passport Number',
          }),
          AUTaxFileNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.AUTaxFileNumber',
            message: 'Australia Tax File Number',
          }),
          ATIdentityCard: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ATIdentityCard',
            message: 'Austria Identity Card',
          }),
          ATTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ATTaxIdentificationNumber',
            message: 'Austria Tax Identification Number',
          }),
          ATValueAddedTaxNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ATValueAddedTaxNumber',
            message: 'Austria Value Added Tax Number',
          }),
          BENationalNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.BENationalNumber',
            message: 'Belgium National Number',
          }),
          BEValueAddedTaxNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.BEValueAddedTaxNumber',
            message: 'Belgium Value Added Tax Number',
          }),
          BRCPFNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.BRCPFNumber',
            message: 'Brazil CPF Number',
          }),
          BRLegalEntityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.BRLegalEntityNumber',
            message: 'Brazil Legal Entity Number',
          }),
          BRNationalIDRG: _({
            id: 'guardrails.definitions.pii_detection.option.entities.BRNationalIDRG',
            message: 'Brazil National ID (RG)',
          }),
          BGUniformCivilNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.BGUniformCivilNumber',
            message: 'Bulgaria Uniform Civil Number',
          }),
          CABankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CABankAccountNumber',
            message: 'Canada Bank Account Number',
          }),
          CADriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CADriversLicenseNumber',
            message: "Canada Driver's License Number",
          }),
          CAHealthServiceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CAHealthServiceNumber',
            message: 'Canada Health Service Number',
          }),
          CAPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CAPassportNumber',
            message: 'Canada Passport Number',
          }),
          CAPersonalHealthIdentification: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CAPersonalHealthIdentification',
            message: 'Canada Personal Health Identification',
          }),
          CASocialInsuranceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CASocialInsuranceNumber',
            message: 'Canada Social Insurance Number',
          }),
          CLIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CLIdentityCardNumber',
            message: 'Chile Identity Card Number',
          }),
          CNResidentIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CNResidentIdentityCardNumber',
            message: 'China Resident Identity Card Number',
          }),
          HRIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HRIdentityCardNumber',
            message: 'Croatia Identity Card Number',
          }),
          HRNationalIDNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HRNationalIDNumber',
            message: 'Croatia National ID Number',
          }),
          HRPersonalIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HRPersonalIdentificationNumber',
            message: 'Croatia Personal Identification Number',
          }),
          CYIdentityCard: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CYIdentityCard',
            message: 'Cyprus Identity Card',
          }),
          CYTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CYTaxIdentificationNumber',
            message: 'Cyprus Tax Identification Number',
          }),
          CZPersonalIdentityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CZPersonalIdentityNumber',
            message: 'Czech Republic Personal Identity Number',
          }),
          EEPersonalIdentificationCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EEPersonalIdentificationCode',
            message: 'Estonia Personal Identification Code',
          }),
          EUDebitCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EUDebitCardNumber',
            message: 'EU Debit Card Number',
          }),
          EUDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EUDriversLicenseNumber',
            message: "EU Driver's License Number",
          }),
          EUNationalIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EUNationalIdentificationNumber',
            message: 'EU National Identification Number',
          }),
          EUPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EUPassportNumber',
            message: 'EU Passport Number',
          }),
          EUSocialSecurityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EUSocialSecurityNumber',
            message: 'EU Social Security Number',
          }),
          EUTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EUTaxIdentificationNumber',
            message: 'EU Tax Identification Number',
          }),
          FIEuropeanHealthNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FIEuropeanHealthNumber',
            message: 'Finland European Health Number',
          }),
          FRDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRDriversLicenseNumber',
            message: "France Driver's License Number",
          }),
          FRHealthInsuranceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRHealthInsuranceNumber',
            message: 'France Health Insurance Number',
          }),
          FRNationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRNationalID',
            message: 'France National ID',
          }),
          FRPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRPassportNumber',
            message: 'France Passport Number',
          }),
          FRSocialSecurityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRSocialSecurityNumber',
            message: 'France Social Security Number',
          }),
          FRTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRTaxIdentificationNumber',
            message: 'France Tax Identification Number',
          }),
          FRValueAddedTaxNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FRValueAddedTaxNumber',
            message: 'France Value Added Tax Number',
          }),
          DEDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DEDriversLicenseNumber',
            message: "Germany Driver's License Number",
          }),
          DEIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DEIdentityCardNumber',
            message: 'Germany Identity Card Number',
          }),
          DEPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DEPassportNumber',
            message: 'Germany Passport Number',
          }),
          DETaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DETaxIdentificationNumber',
            message: 'Germany Tax Identification Number',
          }),
          DEValueAddedNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DEValueAddedNumber',
            message: 'Germany Value Added Tax Number',
          }),
          GRNationalIDCard: _({
            id: 'guardrails.definitions.pii_detection.option.entities.GRNationalIDCard',
            message: 'Greece National ID Card',
          }),
          GRTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.GRTaxIdentificationNumber',
            message: 'Greece Tax Identification Number',
          }),
          HKIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HKIdentityCardNumber',
            message: 'Hong Kong SAR Identity Card Number',
          }),
          HUPersonalIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HUPersonalIdentificationNumber',
            message: 'Hungary Personal Identification Number',
          }),
          HUTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HUTaxIdentificationNumber',
            message: 'Hungary Tax Identification Number',
          }),
          HUValueAddedNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.HUValueAddedNumber',
            message: 'Hungary Value Added Tax Number',
          }),
          INPermanentAccount: _({
            id: 'guardrails.definitions.pii_detection.option.entities.INPermanentAccount',
            message: 'India Permanent Account Number (PAN)',
          }),
          INUniqueIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.INUniqueIdentificationNumber',
            message: 'India Unique Identification Number',
          }),
          IDIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.IDIdentityCardNumber',
            message: 'Indonesia Identity Card Number',
          }),
          IEPersonalPublicServiceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.IEPersonalPublicServiceNumber',
            message: 'Ireland Personal Public Service Number',
          }),
          ILBankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ILBankAccountNumber',
            message: 'Israel Bank Account Number',
          }),
          ILNationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ILNationalID',
            message: 'Israel National ID',
          }),
          ITDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ITDriversLicenseNumber',
            message: "Italy Driver's License Number",
          }),
          ITFiscalCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ITFiscalCode',
            message: 'Italy Fiscal Code',
          }),
          ITValueAddedTaxNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ITValueAddedTaxNumber',
            message: 'Italy Value Added Tax Number',
          }),
          JPBankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPBankAccountNumber',
            message: 'Japan Bank Account Number',
          }),
          JPDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPDriversLicenseNumber',
            message: "Japan Driver's License Number",
          }),
          JPMyNumberCorporate: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPMyNumberCorporate',
            message: 'Japan My Number (Corporate)',
          }),
          JPMyNumberPersonal: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPMyNumberPersonal',
            message: 'Japan My Number (Personal)',
          }),
          JPPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPPassportNumber',
            message: 'Japan Passport Number',
          }),
          JPResidenceCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPResidenceCardNumber',
            message: 'Japan Residence Card Number',
          }),
          JPResidentRegistrationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPResidentRegistrationNumber',
            message: 'Japan Resident Registration Number',
          }),
          JPSocialInsuranceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.JPSocialInsuranceNumber',
            message: 'Japan Social Insurance Number',
          }),
          LVPersonalCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.LVPersonalCode',
            message: 'Latvia Personal Code',
          }),
          LTPersonalCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.LTPersonalCode',
            message: 'Lithuania Personal Code',
          }),
          LUNationalIdentificationNumberNatural: _({
            id: 'guardrails.definitions.pii_detection.option.entities.LUNationalIdentificationNumberNatural',
            message: 'Luxembourg National Identification Number (Natural Persons)',
          }),
          LUNationalIdentificationNumberNonNatural: _({
            id: 'guardrails.definitions.pii_detection.option.entities.LUNationalIdentificationNumberNonNatural',
            message: 'Luxembourg National Identification Number (Non-natural Persons)',
          }),
          MYIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.MYIdentityCardNumber',
            message: 'Malaysia Identity Card Number',
          }),
          MTIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.MTIdentityCardNumber',
            message: 'Malta Identity Card Number',
          }),
          MTTaxIDNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.MTTaxIDNumber',
            message: 'Malta Tax ID Number',
          }),
          NLTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NLTaxIdentificationNumber',
            message: 'Netherlands Tax Identification Number',
          }),
          NLValueAddedTaxNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NLValueAddedTaxNumber',
            message: 'Netherlands Value Added Tax Number',
          }),
          NZBankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NZBankAccountNumber',
            message: 'New Zealand Bank Account Number',
          }),
          NZDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NZDriversLicenseNumber',
            message: "New Zealand Driver's License Number",
          }),
          NZInlandRevenueNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NZInlandRevenueNumber',
            message: 'New Zealand Inland Revenue Number',
          }),
          NZMinistryOfHealthNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NZMinistryOfHealthNumber',
            message: 'New Zealand Ministry of Health Number',
          }),
          NZSocialWelfareNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NZSocialWelfareNumber',
            message: 'New Zealand Social Welfare Number',
          }),
          PHUnifiedMultiPurposeIDNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PHUnifiedMultiPurposeIDNumber',
            message: 'Philippines Unified Multi-Purpose ID Number',
          }),
          PLIdentityCard: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PLIdentityCard',
            message: 'Poland Identity Card',
          }),
          PLNationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PLNationalID',
            message: 'Poland National ID',
          }),
          PLPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PLPassportNumber',
            message: 'Poland Passport Number',
          }),
          PLREGONNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PLREGONNumber',
            message: 'Poland REGON Number',
          }),
          PLTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PLTaxIdentificationNumber',
            message: 'Poland Tax Identification Number',
          }),
          PTCitizenCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PTCitizenCardNumber',
            message: 'Portugal Citizen Card Number',
          }),
          PTTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PTTaxIdentificationNumber',
            message: 'Portugal Tax Identification Number',
          }),
          ROPersonalNumericalCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ROPersonalNumericalCode',
            message: 'Romania Personal Numerical Code',
          }),
          RUPassportNumberDomestic: _({
            id: 'guardrails.definitions.pii_detection.option.entities.RUPassportNumberDomestic',
            message: 'Russia Passport Number (Domestic)',
          }),
          RUPassportNumberInternational: _({
            id: 'guardrails.definitions.pii_detection.option.entities.RUPassportNumberInternational',
            message: 'Russia Passport Number (International)',
          }),
          SANationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SANationalID',
            message: 'Saudi Arabia National ID',
          }),
          SGNationalRegistrationIdentityCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SGNationalRegistrationIdentityCardNumber',
            message: 'Singapore National Registration Identity Card Number',
          }),
          SKPersonalNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SKPersonalNumber',
            message: 'Slovakia Personal Number',
          }),
          SITaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SITaxIdentificationNumber',
            message: 'Slovenia Tax Identification Number',
          }),
          SIUniqueMasterCitizenNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SIUniqueMasterCitizenNumber',
            message: 'Slovenia Unique Master Citizen Number',
          }),
          ZAIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ZAIdentificationNumber',
            message: 'South Africa Identification Number',
          }),
          KRResidentRegistrationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.KRResidentRegistrationNumber',
            message: 'South Korea Resident Registration Number',
          }),
          ESDNI: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ESDNI',
            message: 'Spain DNI',
          }),
          ESSocialSecurityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ESSocialSecurityNumber',
            message: 'Spain Social Security Number',
          }),
          ESTaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ESTaxIdentificationNumber',
            message: 'Spain Tax Identification Number',
          }),
          SEPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SEPassportNumber',
            message: 'Sweden Passport Number',
          }),
          SETaxIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SETaxIdentificationNumber',
            message: 'Sweden Tax Identification Number',
          }),
          CHSocialSecurityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CHSocialSecurityNumber',
            message: 'Switzerland Social Security Number',
          }),
          TWNationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.TWNationalID',
            message: 'Taiwan National ID',
          }),
          TWPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.TWPassportNumber',
            message: 'Taiwan Passport Number',
          }),
          TWResidentCertificate: _({
            id: 'guardrails.definitions.pii_detection.option.entities.TWResidentCertificate',
            message: 'Taiwan Resident Certificate',
          }),
          THPopulationIdentificationCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.THPopulationIdentificationCode',
            message: 'Thailand Population Identification Code',
          }),
          TRNationalIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.TRNationalIdentificationNumber',
            message: 'Türkiye National Identification Number',
          }),
          UAPassportNumberDomestic: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UAPassportNumberDomestic',
            message: 'Ukraine Passport Number (Domestic)',
          }),
          UAPassportNumberInternational: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UAPassportNumberInternational',
            message: 'Ukraine Passport Number (International)',
          }),
          UKElectoralRollNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKElectoralRollNumber',
            message: 'UK Electoral Roll Number',
          }),
          UKNationalHealthNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKNationalHealthNumber',
            message: 'UK National Health Number',
          }),
          UKNationalInsuranceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKNationalInsuranceNumber',
            message: 'UK National Insurance Number',
          }),
        },
      },
    },

    prompt_injection: {
      displayName: _({
        id: 'guardrails.definitions.prompt_injection.display-name',
        message: 'Prompt injection',
      }),
      // Keeps its "This validator is provided by..." form: the third-party vendor attribution
      // is load-bearing and only Agents carries it.
      description: _({
        id: 'guardrails.definitions.prompt_injection.description',
        message:
          'This validator is provided by Noma Security and is built to detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
      }),
      paramLabels: {
        threshold: _({
          id: 'guardrails.definitions.prompt_injection.param.threshold.label',
          message: 'Detection threshold',
        }),
      },
      paramTooltips: {
        threshold: _({
          id: 'guardrails.definitions.prompt_injection.param.threshold.tooltip',
          message:
            'Value between 0 and 1. The sensitivity level for Prompt Injection detection. Higher thresholds detect more potential Prompt Injection but may result in more false positives.',
        }),
      },
    },

    harmful_content: {
      displayName: _({
        id: 'guardrails.definitions.harmful_content.display-name',
        message: 'Harmful content',
      }),
      description: _({
        id: 'guardrails.definitions.harmful_content.description',
        message: 'Detect harmful content (e.g. hate, violence) using Azure AI Content Safety.',
      }),
      paramLabels: {
        harmfulContentEntities: _({
          id: 'guardrails.definitions.harmful_content.param.harmfulContentEntities.label',
          message: 'Content categories',
        }),
        harmfulContentEntityThresholds: _({
          id: 'guardrails.definitions.harmful_content.param.harmfulContentEntityThresholds.label',
          message: 'Severity thresholds',
        }),
      },
      paramTooltips: {
        harmfulContentEntityThresholds: _({
          id: 'guardrails.definitions.harmful_content.param.harmfulContentEntityThresholds.tooltip',
          message:
            'Integer value between 0 and 6 (step 2). The severity threshold for harmful content detection. Higher values require more severe content before triggering.',
        }),
      },
      optionLabels: {
        harmfulContentEntities: {
          Hate: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.Hate',
            message: 'Hate',
          }),
          SelfHarm: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.SelfHarm',
            message: 'Self-harm',
          }),
          Sexual: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.Sexual',
            message: 'Sexual',
          }),
          Violence: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.Violence',
            message: 'Violence',
          }),
        },
      },
    },

    user_prompt_attacks: {
      displayName: _({
        id: 'guardrails.definitions.user_prompt_attacks.display-name',
        message: 'User prompt attacks',
      }),
      description: _({
        id: 'guardrails.definitions.user_prompt_attacks.description',
        message:
          'Detect user prompt attacks that attempt to bypass system instructions using Azure AI Content Safety.',
      }),
      paramLabels: {},
    },

    intellectual_property: {
      displayName: _({
        id: 'guardrails.definitions.intellectual_property.display-name',
        message: 'Intellectual property',
      }),
      description: _({
        id: 'guardrails.definitions.intellectual_property.description',
        message:
          'Detect potential intellectual property violations in text and code using Azure AI Content Safety.',
      }),
      paramLabels: {
        ipEntities: _({
          id: 'guardrails.definitions.intellectual_property.param.ipEntities.label',
          message: 'Content types',
        }),
      },
      optionLabels: {
        ipEntities: {
          Text: _({
            id: 'guardrails.definitions.intellectual_property.option.ipEntities.Text',
            message: 'Text',
          }),
          Code: _({
            id: 'guardrails.definitions.intellectual_property.option.ipEntities.Code',
            message: 'Code',
          }),
        },
      },
    },

    llm_as_judge: {
      displayName: _({
        id: 'guardrails.definitions.llm_as_judge.display-name',
        message: 'LLM as Judge',
      }),
      description: _({
        id: 'guardrails.definitions.llm_as_judge.description',
        message: 'Detect violations of a rule you define, using an LLM as the judge.',
      }),
      usageNote: _({
        id: 'guardrails.definitions.llm_as_judge.usage-note',
        message:
          "Judge model calls consume Agent units the same way the agent's own LLM calls do. Apply selectively to keep cost predictable, and choose the judge model with cost in mind — rates vary by model.",
      }),
      paramLabels: {
        guardrailText: _({
          id: 'guardrails.definitions.llm_as_judge.param.guardrailText.label',
          message: 'Rule prompt',
        }),
        model: _({
          id: 'guardrails.definitions.llm_as_judge.param.model.label',
          message: 'Judge model',
        }),
        positiveExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.positiveExamples.label',
          message: 'Positive examples',
        }),
        negativeExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.negativeExamples.label',
          message: 'Negative examples',
        }),
        threshold: _({
          id: 'guardrails.definitions.llm_as_judge.param.threshold.label',
          message: 'Strictness',
        }),
      },
      paramTooltips: {
        guardrailText: _({
          id: 'guardrails.definitions.llm_as_judge.param.guardrailText.tooltip',
          message:
            'Describe the rule the judge will enforce. Be specific about what should pass and what should fail.',
        }),
        model: _({
          id: 'guardrails.definitions.llm_as_judge.param.model.tooltip',
          message: 'The model used to evaluate the policy against each payload.',
        }),
        positiveExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.positiveExamples.tooltip',
          message:
            'Optional payloads that should pass the policy. Used by the judge as calibration anchors.',
        }),
        negativeExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.negativeExamples.tooltip',
          message:
            'Optional payloads that should fail the policy. Used by the judge as calibration anchors.',
        }),
        threshold: _({
          id: 'guardrails.definitions.llm_as_judge.param.threshold.tooltip',
          message:
            'Strictness on a 0–6 scale. Lower values are stricter — the judge flags anything that hints at a violation. Higher values are more lenient — only clear, unambiguous violations are flagged.',
        }),
      },
    },

    // Agents' wording throughout: Flow has no sentiment guardrail yet.
    sentiment: {
      displayName: _({
        id: 'guardrails.definitions.sentiment.display-name',
        message: 'Sentiment',
      }),
      description: _({
        id: 'guardrails.definitions.sentiment.description',
        message:
          'This validator is provided by Microsoft Azure AI Language and detects the sentiment of text in LLM calls, so a configured tone can be blocked.',
      }),
      paramLabels: {
        sentiments: _({
          id: 'guardrails.definitions.sentiment.param.sentiments.label',
          message: 'Sentiments',
        }),
        sentimentThresholds: _({
          id: 'guardrails.definitions.sentiment.param.sentimentThresholds.label',
          message: 'Confidence thresholds',
        }),
        language: _({
          id: 'guardrails.definitions.sentiment.param.language.label',
          message: 'Languages',
        }),
      },
      paramTooltips: {
        sentiments: _({
          id: 'guardrails.definitions.sentiment.param.sentiments.tooltip',
          message:
            'The guardrail trips when the detected sentiment is one of these. Mixed has no confidence score, so selecting it trips on the label alone and its threshold is ignored.',
        }),
        sentimentThresholds: _({
          id: 'guardrails.definitions.sentiment.param.sentimentThresholds.tooltip',
          message:
            'Minimum confidence, from 0 to 1, before a selected sentiment trips the guardrail. The threshold for Mixed has no effect.',
        }),
        language: _({
          id: 'guardrails.definitions.sentiment.param.language.tooltip',
          message:
            'Which language the text is scored as. One language is used directly; listing several detects the language first, which doubles the calls made to Azure.',
        }),
      },
      optionLabels: {
        sentiments: {
          Positive: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Positive',
            message: 'Positive',
          }),
          Neutral: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Neutral',
            message: 'Neutral',
          }),
          Negative: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Negative',
            message: 'Negative',
          }),
          Mixed: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Mixed',
            message: 'Mixed',
          }),
        },
        language: {
          en: _({ id: 'guardrails.definitions.sentiment.option.language.en', message: 'English' }),
          es: _({ id: 'guardrails.definitions.sentiment.option.language.es', message: 'Spanish' }),
          fr: _({ id: 'guardrails.definitions.sentiment.option.language.fr', message: 'French' }),
          de: _({ id: 'guardrails.definitions.sentiment.option.language.de', message: 'German' }),
          it: _({ id: 'guardrails.definitions.sentiment.option.language.it', message: 'Italian' }),
          'pt-BR': _({
            id: 'guardrails.definitions.sentiment.option.language.pt-BR',
            message: 'Portuguese (Brazil)',
          }),
          'pt-PT': _({
            id: 'guardrails.definitions.sentiment.option.language.pt-PT',
            message: 'Portuguese (Portugal)',
          }),
          nl: _({ id: 'guardrails.definitions.sentiment.option.language.nl', message: 'Dutch' }),
          sv: _({ id: 'guardrails.definitions.sentiment.option.language.sv', message: 'Swedish' }),
          da: _({ id: 'guardrails.definitions.sentiment.option.language.da', message: 'Danish' }),
          no: _({
            id: 'guardrails.definitions.sentiment.option.language.no',
            message: 'Norwegian',
          }),
          fi: _({ id: 'guardrails.definitions.sentiment.option.language.fi', message: 'Finnish' }),
          pl: _({ id: 'guardrails.definitions.sentiment.option.language.pl', message: 'Polish' }),
          cs: _({ id: 'guardrails.definitions.sentiment.option.language.cs', message: 'Czech' }),
          ru: _({ id: 'guardrails.definitions.sentiment.option.language.ru', message: 'Russian' }),
          uk: _({
            id: 'guardrails.definitions.sentiment.option.language.uk',
            message: 'Ukrainian',
          }),
          tr: _({ id: 'guardrails.definitions.sentiment.option.language.tr', message: 'Turkish' }),
          el: _({ id: 'guardrails.definitions.sentiment.option.language.el', message: 'Greek' }),
          he: _({ id: 'guardrails.definitions.sentiment.option.language.he', message: 'Hebrew' }),
          ar: _({ id: 'guardrails.definitions.sentiment.option.language.ar', message: 'Arabic' }),
          hi: _({ id: 'guardrails.definitions.sentiment.option.language.hi', message: 'Hindi' }),
          ja: _({ id: 'guardrails.definitions.sentiment.option.language.ja', message: 'Japanese' }),
          ko: _({ id: 'guardrails.definitions.sentiment.option.language.ko', message: 'Korean' }),
          'zh-hans': _({
            id: 'guardrails.definitions.sentiment.option.language.zh-hans',
            message: 'Chinese (Simplified)',
          }),
          'zh-hant': _({
            id: 'guardrails.definitions.sentiment.option.language.zh-hant',
            message: 'Chinese (Traditional)',
          }),
          id: _({
            id: 'guardrails.definitions.sentiment.option.language.id',
            message: 'Indonesian',
          }),
          vi: _({
            id: 'guardrails.definitions.sentiment.option.language.vi',
            message: 'Vietnamese',
          }),
          th: _({ id: 'guardrails.definitions.sentiment.option.language.th', message: 'Thai' }),
        },
      },
    },
  };
}

/** The raw validator ids this package ships curated copy for. */
export const CURATED_GUARDRAIL_VALIDATORS: readonly string[] = Object.freeze([
  'pii_detection',
  'prompt_injection',
  'harmful_content',
  'user_prompt_attacks',
  'intellectual_property',
  'llm_as_judge',
  'sentiment',
]);

/**
 * The English copy, resolved without a lingui provider. This is the default
 * `enrichGuardrailDefinitions` uses, so the pure layer stays usable outside React.
 */
export const GUARDRAIL_COPY_EN: GuardrailCopyTable = buildGuardrailCopy(
  (descriptor) => descriptor.message
);

function collectEnglishMessages(): Record<string, string> {
  const messages: Record<string, string> = {};
  buildGuardrailCopy((descriptor) => {
    messages[descriptor.id] = descriptor.message;
    return descriptor.message;
  });
  return messages;
}

/**
 * The same copy flattened to message id to English string. Exported so hosts can diff their
 * remaining local tables against it in CI while they migrate off them.
 */
export const GUARDRAIL_COPY_EN_MESSAGES: Readonly<Record<string, string>> = Object.freeze(
  collectEnglishMessages()
);

/**
 * The curated copy in the active locale. Recomputes when the lingui context changes, which is
 * what makes a locale switch re-enrich in `useGuardrailDefinitions`. Without a provider every
 * string resolves to its English default.
 */
export function useGuardrailDefinitionCopy(): GuardrailCopyTable {
  const { _ } = useSafeLingui();
  return useMemo(() => buildGuardrailCopy(_), [_]);
}
