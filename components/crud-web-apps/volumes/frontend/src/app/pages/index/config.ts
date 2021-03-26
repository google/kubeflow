import {
  PropertyValue,
  StatusValue,
  ActionListValue,
  ActionIconValue,
  TRUNCATE_TEXT_SIZE,
  TableConfig,
} from 'kubeflow';

export const tableConfig: TableConfig = {
  title: 'Volumes',
  newButtonText: 'NEW VOLUME',
  columns: [
    {
      matHeaderCellDef: 'Status',
      matColumnDef: 'status',
      value: new StatusValue(),
    },
    {
      matHeaderCellDef: 'Name',
      matColumnDef: 'name',
      value: new PropertyValue({
        field: 'name',
        tooltipField: 'name',
        truncate: TRUNCATE_TEXT_SIZE.SMALL,
      }),
    },
    {
      matHeaderCellDef: 'Age',
      matColumnDef: 'age',
      value: new PropertyValue({
        field: 'age.uptime',
        tooltipField: 'age.timestamp',
      }),
    },
    {
      matHeaderCellDef: 'Size',
      matColumnDef: 'size',
      value: new PropertyValue({ field: 'capacity' }),
    },
    {
      matHeaderCellDef: 'Access Mode',
      matColumnDef: 'modes',
      value: new PropertyValue({ field: 'modes' }),
    },
    {
      matHeaderCellDef: 'Storage Class',
      matColumnDef: 'class',
      value: new PropertyValue({ field: 'class' }),
    },

    // the apps should import the actions they want
  ],
};
