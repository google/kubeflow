import {
  PropertyValue,
  StatusValue,
  ActionListValue,
  ActionIconValue,
  ActionButtonValue,
  TRUNCATE_TEXT_SIZE,
  MenuValue,
  DialogConfig,
  ComponentValue,
} from 'kubeflow';
import { ServerTypeComponent } from './server-type/server-type.component';

// --- Configs for the Confirm Dialogs ---
export function getDeleteDialogConfig(name: string): DialogConfig {
  return {
    title: {
      key: 'dialog.deleteDialogTitle',
      params: { name: name },
    },
    message: 'dialog.deleteDialogMessage',
    accept: 'common.deleteCaps',
    confirmColor: 'warn',
    cancel: 'common.cancelCaps',
    error: '',
    applying: 'dialog.deletingCaps',
    width: '600px',
  };
}

export function getStopDialogConfig(name: string): DialogConfig {
  return {
    title: {
      key: 'dialog.stopDialogTitle',
      params: { name: name },
    },
    message: 'dialog.stopDialogMessage',
    accept: 'common.stopCaps',
    confirmColor: 'primary',
    cancel: 'common.cancelCaps',
    error: '',
    applying: 'dialog.stoppingCaps',
    width: '600px',
  };
}

// --- Config for the Resource Table ---
export const defaultConfig = {
  title: 'indexTableConfig.notebookServers',
  newButtonText: 'indexTableConfig.newServersCaps',
  columns: [
    {
      matHeaderCellDef: 'indexTableConfig.status',
      matColumnDef: 'status',
      value: new StatusValue(),
    },
    {
      matHeaderCellDef: 'indexTableConfig.name',
      matColumnDef: 'name',
      value: new PropertyValue({
        field: 'name',
        truncate: TRUNCATE_TEXT_SIZE.SMALL,
        tooltipField: 'name',
      }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.type',
      matColumnDef: 'type',
      value: new ComponentValue({
        component: ServerTypeComponent,
      }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.age',
      matColumnDef: 'age',
      value: new PropertyValue({ field: 'age' }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.image',
      matColumnDef: 'image',
      value: new PropertyValue({
        field: 'shortImage',
        tooltipField: 'image',
        truncate: TRUNCATE_TEXT_SIZE.MEDIUM,
      }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.gpus',
      matColumnDef: 'gpus',
      value: new PropertyValue({
        field: 'gpus.count',
        tooltipField: 'gpus.message',
      }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.cpus',
      matColumnDef: 'cpu',
      value: new PropertyValue({ field: 'cpu' }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.memory',
      matColumnDef: 'memory',
      value: new PropertyValue({ field: 'memory' }),
    },
    {
      matHeaderCellDef: 'indexTableConfig.volumes',
      matColumnDef: 'volumes',
      value: new MenuValue({ field: 'volumes', itemsIcon: 'storage' }),
    },

    {
      matHeaderCellDef: '',
      matColumnDef: 'actions',
      value: new ActionListValue([
        new ActionButtonValue({
          name: 'connect',
          tooltip: 'indexTableConfig.connectTooltip',
          color: 'primary',
          field: 'connectAction',
          text: 'indexTableConfig.connectCaps',
        }),
        new ActionIconValue({
          name: 'start-stop',
          tooltipInit: 'indexTableConfig.stopNotebookServer',
          tooltipReady: 'indexTableConfig.startNotebookServer',
          color: '',
          field: 'startStopAction',
          iconInit: 'material:stop',
          iconReady: 'material:play_arrow',
        }),
        new ActionIconValue({
          name: 'delete',
          tooltip: 'indexTableConfig.deleteTooltip',
          color: '',
          field: 'deleteAction',
          iconReady: 'material:delete',
        }),
      ]),
    },
  ],
};
