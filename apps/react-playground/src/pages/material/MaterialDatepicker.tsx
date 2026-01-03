import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { FormGrid, VariantSection } from "./MaterialDatepicker.styles";

export function MaterialDatepicker() {
	const [basicDate, setBasicDate] = useState<Dayjs | null>(dayjs());
	const [readOnlyDate] = useState<Dayjs | null>(dayjs());
	const [disabledDate] = useState<Dayjs | null>(dayjs());
	const [requiredDate, setRequiredDate] = useState<Dayjs | null>(null);

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<PageContainer>
				<PageTitle>DatePicker</PageTitle>
				<PageDescription>
					Material UI DatePicker component with Apollo theme overrides. Provides
					an accessible date selection interface with calendar popover.
				</PageDescription>

				<VariantSection>
					<SectionHeader>Basic DatePicker</SectionHeader>
					<SectionDescription>
						Standard date picker with Apollo theme styling.
					</SectionDescription>
					<FormGrid>
						<DatePicker
							label="Select Date"
							value={basicDate}
							onChange={(newValue) => setBasicDate(newValue)}
							sx={{ minWidth: 300 }}
						/>
					</FormGrid>
				</VariantSection>

				<VariantSection>
					<SectionHeader>Required Field</SectionHeader>
					<SectionDescription>
						DatePicker marked as required with asterisk.
					</SectionDescription>
					<FormGrid>
						<DatePicker
							label="Required Date"
							value={requiredDate}
							onChange={(newValue) => setRequiredDate(newValue)}
							slotProps={{
								textField: {
									required: true,
								},
							}}
							sx={{ minWidth: 300 }}
						/>
					</FormGrid>
				</VariantSection>

				<VariantSection>
					<SectionHeader>Read-Only</SectionHeader>
					<SectionDescription>
						DatePicker in read-only mode (cannot be changed).
					</SectionDescription>
					<FormGrid>
						<DatePicker
							label="Read-Only Date"
							value={readOnlyDate}
							readOnly
							sx={{ minWidth: 300 }}
						/>
					</FormGrid>
				</VariantSection>

				<VariantSection>
					<SectionHeader>Disabled State</SectionHeader>
					<SectionDescription>
						DatePicker in disabled state with muted styling.
					</SectionDescription>
					<FormGrid>
						<DatePicker
							label="Disabled Date"
							value={disabledDate}
							disabled
							sx={{ minWidth: 300 }}
						/>
					</FormGrid>
				</VariantSection>

				<VariantSection>
					<SectionHeader>Different Views</SectionHeader>
					<SectionDescription>
						DatePickers with different default calendar views.
					</SectionDescription>
					<FormGrid>
						<DatePicker
							label="Year View"
							value={basicDate}
							onChange={(newValue) => setBasicDate(newValue)}
							views={["year", "month", "day"]}
							openTo="year"
							sx={{ minWidth: 300 }}
						/>
						<DatePicker
							label="Month View"
							value={basicDate}
							onChange={(newValue) => setBasicDate(newValue)}
							views={["year", "month", "day"]}
							openTo="month"
							sx={{ minWidth: 300 }}
						/>
					</FormGrid>
				</VariantSection>

				<VariantSection>
					<SectionHeader>Date Constraints</SectionHeader>
					<SectionDescription>
						DatePickers with minimum and maximum date restrictions.
					</SectionDescription>
					<FormGrid>
						<DatePicker
							label="Future Dates Only"
							value={basicDate}
							onChange={(newValue) => setBasicDate(newValue)}
							minDate={dayjs()}
							sx={{ minWidth: 300 }}
						/>
						<DatePicker
							label="This Month Only"
							value={basicDate}
							onChange={(newValue) => setBasicDate(newValue)}
							minDate={dayjs().startOf("month")}
							maxDate={dayjs().endOf("month")}
							sx={{ minWidth: 300 }}
						/>
					</FormGrid>
				</VariantSection>
			</PageContainer>
		</LocalizationProvider>
	);
}
