import { ConfigVolume, Config, GPU } from 'src/app/utils/types';
import { Validators, FormBuilder, FormGroup, FormArray } from '@angular/forms';

const fb = new FormBuilder();

export function getFormDefaults(): FormGroup {
  return fb.group({
    name: ['', [Validators.required]],
    namespace: ['', [Validators.required]],
    image: ['', [Validators.required]],
    customImage: ['', []],
    customImageCheck: [false, []],
    cpu: ['', [Validators.required]],
    memory: ['', [Validators.required]],
    gpus: fb.group({
      vendor: ['', []],
      num: ['', []],
    }),
    noWorkspace: [false, []],
    workspace: fb.group({
      type: ['', [Validators.required]],
      name: ['', [Validators.required]],
      templatedName: ['', []],
      size: ['', [Validators.required]],
      path: [{ value: '', disabled: true }, [Validators.required]],
      mode: ['', [Validators.required]],
      class: ['{none}', [Validators.required]],
      extraFields: fb.group({}),
    }),
    datavols: fb.array([]),
    shm: [true, []],
    configurations: [[], []],
    affinityConfig: ['', []],
    tolerationGroup: ['', []],
  });
}

export function createVolumeControl(vol: ConfigVolume, readonly = false) {
  const ctrl = fb.group({
    type: [vol.type.value, [Validators.required]],
    name: [vol.name.value, [Validators.required]],
    templatedName: [vol.name.value, []],
    size: [vol.size.value, [Validators.required]],
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
  volCtrl.get('size').setValue(vol.size.value);
  volCtrl.get('mode').setValue(vol.accessModes.value);
  volCtrl.get('path').setValue(vol.mountPath.value);
  volCtrl.get('class').setValue(vol.class.value);
  volCtrl.get('templatedName').setValue(vol.name.value);

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
        value: '{none}',
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
  formCtrl.controls.cpu.setValue(config.cpu.value);
  if (config.cpu.readOnly) {
    formCtrl.controls.cpu.disable();
  }

  formCtrl.controls.memory.setValue(config.memory.value);
  if (config.memory.readOnly) {
    formCtrl.controls.memory.disable();
  }

  formCtrl.controls.image.setValue(config.image.value);
  if (config.image.readOnly) {
    formCtrl.controls.image.disable();
  }

  updateVolumeControl(
    formCtrl.get('workspace') as FormGroup,
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

  // GPUs
  updateGPUControl(formCtrl.get('gpus') as FormGroup, config.gpus);

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
