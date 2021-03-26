import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ConfigVolume, GPU, Config } from 'src/app/types';
import { getNameSyncValidators, getNameAsyncValidators } from 'kubeflow';

export function getFormDefaults(): FormGroup {
  const fb = new FormBuilder();

  return fb.group({
    name: ['', [Validators.required]],
    namespace: ['', [Validators.required]],
    image: ['', [Validators.required]],
    imageVSCode: ['', [Validators.required]],
    imageRStudio: ['', [Validators.required]],
    allowCustomImage: [true, []],
    imagePullPolicy: ['IfNotPresent', [Validators.required]],
    customImage: ['', []],
    customImageCheck: [false, []],
    serverType: ['jupyter', [Validators.required]],
    cpu: [1, [Validators.required]],
    memory: [1, [Validators.required]],
    gpus: fb.group({
      vendor: ['', []],
      num: ['', []],
    }),
    noWorkspace: [false, []],
    workspace: fb.group({
      type: ['', [Validators.required]],
      name: ['', getNameSyncValidators(), getNameAsyncValidators()],
      templatedName: ['', []],
      size: [1, [Validators.required]],
      path: [{ value: '', disabled: true }, [Validators.required]],
      templatedPath: ['', []],
      mode: ['', [Validators.required]],
      class: ['{none}', [Validators.required]],
      extraFields: fb.group({}),
    }),
    affinityConfig: ['', []],
    tolerationGroup: ['', []],
    datavols: fb.array([]),
    shm: [true, []],
    configurations: [[], []],
  });
}

export function createVolumeControl(vol: ConfigVolume, readonly = false) {
  const fb = new FormBuilder();

  const ctrl = fb.group({
    type: [vol.type.value, [Validators.required]],
    name: ['volume', getNameSyncValidators(), getNameAsyncValidators()],
    templatedName: [vol.name.value, []],
    templatedPath: [vol.mountPath.value, []],
    size: [configSizeToNumber(vol.size.value), [Validators.required]],
    path: [vol.mountPath.value, [Validators.required]],
    mode: [vol.accessModes.value, [Validators.required]],
    class: ['{none}', []],
    extraFields: fb.group({}),
  });

  if (readonly) {
    ctrl.disable();
  }

  return ctrl;
}

export function updateVolumeControl(
  volCtrl: FormGroup,
  vol: ConfigVolume,
  readonly = false,
) {
  volCtrl.get('name').setValue(vol.name.value);
  volCtrl.get('type').setValue(vol.type.value);
  volCtrl.get('size').setValue(configSizeToNumber(vol.size.value));
  volCtrl.get('mode').setValue(vol.accessModes.value);
  volCtrl.get('path').setValue(vol.mountPath.value);
  volCtrl.get('templatedName').setValue(vol.name.value);
  volCtrl.get('templatedPath').setValue(vol.mountPath.value);

  if (readonly) {
    volCtrl.disable();
  }
}

export function addDataVolume(
  formCtrl: FormGroup,
  vol: ConfigVolume = null,
  readonly = false,
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
        value: '{notebook-name}-vol-' + (l + 1),
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
  const ctrl = createVolumeControl(vol, readonly);
  const vols = formCtrl.get('datavols') as FormArray;
  vols.push(ctrl);
}

export function updateGPUControl(formCtrl: FormGroup, gpuConf: any) {
  // If the backend didn't send the value, default to none
  if (gpuConf == null) {
    formCtrl.get('num').setValue('none');
    return;
  }

  // Set the values
  const gpu = gpuConf.value as GPU;
  formCtrl.get('num').setValue(gpu.num);
  formCtrl.get('vendor').setValue(gpu.vendor);

  // Don't allow the user to edit them if the admin does not allow it
  if (gpuConf.readOnly) {
    formCtrl.get('num').disable();
    formCtrl.get('vendor').disable();
  }
}

export function initFormControls(formCtrl: FormGroup, config: Config) {
  // Sets the values from our internal dict. This is an initialization step
  // that should be only run once
  formCtrl.controls.cpu.setValue(configSizeToNumber(config.cpu.value));
  if (config.cpu.readOnly) {
    formCtrl.controls.cpu.disable();
  }

  formCtrl.controls.memory.setValue(configSizeToNumber(config.memory.value));
  if (config.memory.readOnly) {
    formCtrl.controls.memory.disable();
  }

  formCtrl.controls.image.setValue(config.image.value);

  formCtrl.controls.imageVSCode.setValue(config.imageVSCode.value);

  formCtrl.controls.imageRStudio.setValue(config.imageRStudio.value);

  formCtrl.controls.imagePullPolicy.setValue(config.imagePullPolicy.value);
  if (config.imagePullPolicy.readOnly) {
    formCtrl.controls.imagePullPolicy.disable();
  }

  const wsCtrl = formCtrl.get('workspace') as FormGroup;
  updateVolumeControl(
    wsCtrl,
    config.workspaceVolume.value,
    config.workspaceVolume.readOnly,
  );

  // Disable the mount path by default
  const ws = formCtrl.controls.workspace as FormGroup;
  ws.controls.path.disable();

  // Add the data volumes
  config.dataVolumes.value.forEach(vol => {
    // Create a new FormControl to append to the array
    addDataVolume(formCtrl, vol.value, config.dataVolumes.readOnly);
  });

  // Affinity
  formCtrl.controls.affinityConfig.setValue(config.affinityConfig.value);
  if (config.affinityConfig.readOnly) {
    formCtrl.controls.affinityConfig.disable();
  }

  // Tolerations
  formCtrl.controls.tolerationGroup.setValue(config.tolerationGroup.value);
  if (config.tolerationGroup.readOnly) {
    formCtrl.controls.tolerationGroup.disable();
  }

  // GPUs
  updateGPUControl(formCtrl.get('gpus') as FormGroup, config.gpus);

  formCtrl.controls.shm.setValue(config.shm.value);
  if (config.shm.readOnly) {
    formCtrl.controls.shm.disable();
  }

  // PodDefaults / Configurations. Set the pre selected labels
  formCtrl.controls.configurations.setValue(config.configurations.value);
  if (config.configurations.readOnly) {
    formCtrl.controls.configurations.disable();
  }
}

export function configSizeToNumber(size: string | number): number {
  if (typeof size === 'number') {
    return size;
  }

  return Number(size.replace('Gi', ''));
}
