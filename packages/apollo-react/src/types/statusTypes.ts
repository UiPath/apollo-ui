export enum StatusTypes {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  DEFAULT = 'default',
  NONE = 'none',
}

type StatusTypeEnum = Exclude<StatusTypes, StatusTypes.DEFAULT | StatusTypes.NONE>;
export type Status = `${StatusTypeEnum}`;
