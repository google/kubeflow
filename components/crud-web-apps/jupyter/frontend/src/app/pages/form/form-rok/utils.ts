import { ConfigVolume, Volume, emptyVolume } from 'src/app/types';
import { createVolumeControl } from '../form-default/utils';
import {
  FormGroup,
  FormControl,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import {
  RokService,
  updateNonDirtyControl,
  updateControlNonNullValue,
} from 'kubeflow';
import { JupyterLab, emptyJupyterLab } from './types';

export function createRokVolumeControl(vol: ConfigVolume) {
  const volCtrl = createVolumeControl(vol);

  // Set the rokUrl in extraFields
  const extraFields: FormGroup = volCtrl.get('extraFields') as FormGroup;
  extraFields.addControl('rokUrl', new FormControl('', []));
  extraFields.disable();

  return volCtrl;
}

export function addRokDataVolume(
  formCtrl: AbstractControl,
  vol: ConfigVolume = null,
) {
  // If no vol is provided create one with default values
  if (vol === null) {
    const l: number = formCtrl.value.datavols.length;
    const name: string = '{notebook-name}-vol-' + (l + 1);

    vol = {
      type: {
        value: 'New',
      },
      name: {
        value: name,
      },
      size: {
        value: '5',
      },
      mountPath: {
        value: '/home/jovyan/{volume-name}',
      },
      accessModes: {
        value: 'ReadWriteOnce',
      },
    };
  }

  // Push it to the control
  const vols = formCtrl.get('datavols') as FormArray;
  vols.push(createRokVolumeControl(vol));
}

// Functions to create Autofilled Rok Objects
export function getJupyterLabFromRokURL(
  url: string,
  rok: RokService,
): Observable<JupyterLab> {
  return rok.getObjectMetadata(url).pipe(
    map((headers: HttpHeaders) => {
      const notebook: JupyterLab = emptyJupyterLab();

      // Fill the notebook with the info from the response
      notebook.namespace = headers.get('X-Object-Meta-namespace');
      notebook.image = headers.get('X-Object-Meta-image');

      // Convert CPU to number
      notebook.cpu = headers.get('X-Object-Meta-cpu');
      if (typeof notebook.cpu === 'number') {
      } else if (notebook.cpu.includes('m')) {
        const cpu = parseInt(notebook.cpu.replace('m', ''), 10);
        notebook.cpu = cpu / 1000;
      }

      // Convert memory to Gi
      const memory = headers.get('X-Object-Meta-memory');
      if (memory.includes('G')) {
        notebook.memory = parseInt(memory.replace('G', ''), 10);
      } else if (memory.includes('M')) {
        notebook.memory = parseInt(memory.replace('M', ''), 10) / 1000;
      } else {
        notebook.memory = parseInt(memory, 10);
      }

      notebook.environment = headers.get('X-Object-Meta-environment');

      // Workspace Volume
      const workspaceRokUrl = headers.get('X-Object-Group-Member-0-URL');
      notebook.workspace.extraFields = {
        // rokUrl: baseUrl + obj + '?version=' + version,
        rokUrl: workspaceRokUrl,
      };

      // Data Volumes
      const volsNum = headers.get('X-Object-Group-Member-Count');
      for (let i = 1; i < parseInt(volsNum, 10); i++) {
        const volRokUrl = headers.get('X-Object-Group-Member-' + i + '-URL');

        const vol = emptyVolume();
        vol.extraFields = {
          // rokUrl: baseUrl + obj + '?version=' + version,
          rokUrl: volRokUrl,
        };
        notebook.datavols.push(vol);
      }

      return notebook;
    }),
  );
}

export function getVolumeFromRokURL(
  url: string,
  rok: RokService,
): Observable<Volume> {
  return rok.getObjectMetadata(url).pipe(
    map((headers: HttpHeaders) => {
      console.log(`Creating volume object from return metadata`);

      const volume: Volume = emptyVolume();

      // Fill the notebook with the info from the response
      volume.name = headers.get('X-Object-Meta-dataset');
      if (volume.name === null) {
        volume.name = headers.get('X-Object-Meta-workspace');
      }

      const size = parseInt(headers.get('Content-Length'), 10);
      volume.size = size / Math.pow(1024, 3);

      volume.path = headers.get('X-Object-Meta-mountpoint');

      console.log(`Created volume object: ${JSON.stringify(volume)}`);
      return volume;
    }),
  );
}

// Functions for autofilling control values
export function setLabValues(lab: JupyterLab, formCtrl: AbstractControl) {
  console.log(
    `Setting Jupyter Lab form values based on object: ${JSON.stringify(lab)}`,
  );

  formCtrl.get('customImage').setValue(lab.image);
  formCtrl.get('customImageCheck').setValue(true);
  formCtrl.get('cpu').setValue(lab.cpu);
  formCtrl.get('memory').setValue(lab.memory);

  // Change env only if it exists
  if (lab.environment !== null) {
    formCtrl.get('environment').setValue(lab.environment);
  }

  // Set the workspace volume
  formCtrl
    .get('workspace')
    .get('extraFields')
    .get('rokUrl')
    .setValue(lab.workspace.extraFields.rokUrl);
  formCtrl.get('workspace').get('type').setValue('Existing');

  // Clear the existing Data Volumes array
  const dataVols = formCtrl.get('datavols') as FormArray;
  while (dataVols.length !== 0) {
    dataVols.removeAt(0);
  }

  for (const vol of lab.datavols) {
    addRokDataVolume(formCtrl);
  }

  // Set each volume to existing type
  const volsArr = formCtrl.get('datavols') as FormArray;
  for (let i = 0; i < lab.datavols.length; i++) {
    volsArr
      .at(i)
      .get('extraFields')
      .get('rokUrl')
      .setValue(lab.datavols[i].extraFields.rokUrl);

    volsArr.at(i).get('type').setValue('Existing');
  }
}

export function setVolumeValues(vol: Volume, volCtrl: AbstractControl) {
  console.log(
    `Setting Volume form values based on object: ${JSON.stringify(vol)}`,
  );

  const volProps = { size: vol.size, name: vol.name, path: vol.path };

  for (const prop in volProps) {
    if (volProps.hasOwnProperty(prop)) {
      updateControlNonNullValue(
        volCtrl.get(prop),
        volProps[prop],
        `Provided volume has null value for property '${prop}'. ` +
          `Will NOT override the current value.`,
      );
    }
  }
}
