import React from 'react';

import { SxProps, Theme } from '@mui/material';

import { StatusTypes } from '../../../types/statusTypes';

export type AlertBarStatus = Exclude<StatusTypes, StatusTypes.DEFAULT | StatusTypes.NONE>;

export interface ApAlertBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Status/type of the alert */
  status?: AlertBarStatus;
  /** Whether the alert can be dismissed */
  cancelable?: boolean;
  /** Callback when alert is dismissed */
  onCancel?: () => void;
  /** MUI sx prop for styling */
  sx?: SxProps<Theme>;
}
