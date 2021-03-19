import { Config, ConfigGPU, ConfigVolume } from 'src/app/utils/types';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

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
      size: ['', [Validators.required]],
      path: ['', [Validators.required]],
      mode: ['', [Validators.required]],
      class: ['', [Validators.required]],
      extraFields: fb.group({}),
      defaultName: ['', []],
      defaultSize: ['', []],
      defaultMode: ['', []],
      defaultPath: ['', []],
      defaultClass: ['', []],
    }),
    datavols: fb.array([]),
    shm: [true, []],
    configurations: [[], []],
    affinityConfig: ['', []],
    tolerationGroup: ['', []],
  });
}

export function appendDataVolumeControl(volsArray: FormArray,
                                        vol: ConfigVolume,
                                        volumeId: string = "") {
  const _templatedName = vol.name.value.replace("{volume-id}", volumeId)
  const _templatedPath = vol.mountPath.value.replace("{volume-id}", volumeId)

  volsArray.push(
    fb.group({
      type: [vol.type.value, [Validators.required]],
      name: [_templatedName, [Validators.required]],
      size: [vol.size.value, [Validators.required]],
      mode: [vol.accessModes.value, [Validators.required]],
      path: [_templatedPath, [Validators.required]],
      class: [vol.class.value, [Validators.required]],
      extraFields: fb.group({}),
      defaultName: [_templatedName, []],
      defaultSize: [vol.size.value, []],
      defaultMode: [vol.accessModes.value, []],
      defaultPath: [_templatedPath, []],
      defaultClass: [vol.class.value, []],
    })
  );
}

export function updateWorkspaceVolumeControl(volCtrl: FormGroup, vol: ConfigVolume) {
  volCtrl.get('type').setValue(vol.type.value);
  volCtrl.get('name').setValue(vol.name.value);
  volCtrl.get('size').setValue(vol.size.value);
  volCtrl.get('mode').setValue(vol.accessModes.value);
  volCtrl.get('path').setValue(vol.mountPath.value);
  volCtrl.get('class').setValue(vol.class.value);
  volCtrl.get('defaultName').setValue(vol.name.value);
  volCtrl.get('defaultSize').setValue(vol.size.value);
  volCtrl.get('defaultMode').setValue(vol.accessModes.value);
  volCtrl.get('defaultPath').setValue(vol.mountPath.value);
  volCtrl.get('defaultClass').setValue(vol.class.value);

  // dont let users change the mount path
  if (vol.mountPath.readOnly) {
    volCtrl.controls.path.disable();
  }
}

export function updateGPUControl(gpuCtrl: FormGroup, gpus: ConfigGPU) {
  gpuCtrl.get('num').setValue(gpus.num);
  gpuCtrl.get('vendor').setValue(gpus.vendor);
}

// Sets the values from our internal dict
// This is an initialization step that should be only run once
export function initFormControls(formCtrl: FormGroup, config: Config) {
  // Image
  formCtrl.controls.image.setValue(config.image.value);
  if (config.image.readOnly) {
    // we only disable the "Custom Image" checkbox
    // we want the user to be able to select from the provided list
    formCtrl.controls.customImageCheck.disable();
  }

  // CPU
  formCtrl.controls.cpu.setValue(config.cpu.value);
  if (config.cpu.readOnly) {
    formCtrl.controls.cpu.disable();
  }

  // RAM
  formCtrl.controls.memory.setValue(config.memory.value);
  if (config.memory.readOnly) {
    formCtrl.controls.memory.disable();
  }

  // GPUs
  updateGPUControl(
    formCtrl.controls.gpus as FormGroup,
    config.gpus.value
  );
  if (config.gpus.readOnly) {
    formCtrl.controls.gpus.disable()
  }

  // Workspace Volume
  updateWorkspaceVolumeControl(
    formCtrl.controls.workspace as FormGroup,
    config.workspaceVolume.value
  );
  if (config.workspaceVolume.readOnly) {
    formCtrl.controls.workspace.disable();
    formCtrl.controls.noWorkspace.disable();
  }

  // Data Volumes
  config.dataVolumes.value.forEach(vol => {
    // append each default DataVolume to the form
    appendDataVolumeControl(
      formCtrl.controls.datavols as FormArray,
      vol.value
    );
  });
  if (config.dataVolumes.readOnly) {
    formCtrl.controls.datavols.disable()
  }

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

  // PodDefaults
  formCtrl.controls.configurations.setValue(config.configurations.value);
  if (config.configurations.readOnly) {
    formCtrl.controls.configurations.disable();
  }

  // Advanced Options
  formCtrl.controls.shm.setValue(config.shm.value);
  if (config.shm.readOnly) {
    formCtrl.controls.shm.disable();
  }
}
