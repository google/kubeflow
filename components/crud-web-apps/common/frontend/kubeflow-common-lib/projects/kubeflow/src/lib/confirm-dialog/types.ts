export interface DialogConfig {
  title: { key: string; params?: object };
  message: string;
  accept: string;
  applying: string;
  error?: string;
  confirmColor: string;
  cancel: string;
  width?: string;
}

export enum DIALOG_RESP {
  CANCEL = 'cancel',
  ACCEPT = 'accept',
}
