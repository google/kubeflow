import { createVolumeControl } from 'src/app/utils/common';
import { ConfigVolume } from 'src/app/utils/types';
import { FormGroup, FormControl, FormArray } from '@angular/forms';

export function createRokVolumeControl(vol: ConfigVolume) {
  const volCtrl = createVolumeControl(vol);

  // Set the rokUrl in extraFields
  const extraFields: FormGroup = volCtrl.get('extraFields') as FormGroup;
  extraFields.addControl('rokUrl', new FormControl('', []));

  return volCtrl;
}

export function addRokDataVolume(
  formCtrl: FormGroup,
  vol: ConfigVolume = null,
) {
  // If no vol is provided create one with default values
  if (vol === null) {
    const l: number = formCtrl.value.datavols.length;

    vol = {
      type: {
        value: 'New',
      },
      name: {
        value: '{notebook-name}-vol-' + (l + 1),
      },
      size: {
        value: '10Gi',
      },
      mountPath: {
        value: '/home/jovyan/data-vol-' + (l + 1),
      },
      accessModes: {
        value: 'ReadWriteOnce',
      },
      class: {
        value: 'rok',
      },
    };
  }

  // Push it to the control
  const vols = formCtrl.get('datavols') as FormArray;
  vols.push(createRokVolumeControl(vol));
}
