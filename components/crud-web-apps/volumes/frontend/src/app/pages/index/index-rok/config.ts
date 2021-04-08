import {
  ActionListValue,
  ActionIconValue,
  TableColumn,
  TableConfig,
} from 'kubeflow';
import { tableConfig } from '../config';

const actionsCol: TableColumn = {
  matHeaderCellDef: '',
  matColumnDef: 'actions',
  value: new ActionListValue([
    new ActionIconValue({
      name: 'edit',
      tooltip: 'Browse',
      color: 'primary',
      field: 'editAction',
      iconInit: 'material:folder',
      iconReady: 'custom:folderSearch',
    }),
    new ActionIconValue({
      name: 'delete',
      tooltip: 'Delete Volume',
      color: 'warn',
      field: 'deleteAction',
      iconReady: 'material:delete',
    }),
  ]),
};

export const rokConfig: TableConfig = {
  title: tableConfig.title,
  newButtonText: tableConfig.newButtonText,
  columns: tableConfig.columns.concat([actionsCol]),
};
