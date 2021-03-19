import { ConfigVolume } from 'src/app/utils/types';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

const fb = new FormBuilder();

export function createRokVolumeControl(vol: ConfigVolume) {
  const volCtrl = fb.group({
    type: [vol.type.value, [Validators.required]],
    name: [vol.name.value, [Validators.required]],
    size: [vol.size.value, [Validators.required]],
    mode: [vol.accessModes.value, [Validators.required]],
    path: [vol.name.value, [Validators.required]],
    class: [vol.class.value, [Validators.required]],
    extraFields: fb.group({}),
    defaultName: [vol.name.value, []],
  })

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
