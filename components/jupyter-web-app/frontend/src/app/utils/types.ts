// ------------------------
// App Types
// ------------------------
export enum SnackType {
  Success,
  Error,
  Warning,
  Info,
}

// ------------------------
// Kubernetes API Types
// ------------------------
// Kubernetes API Response Type
export interface Resp {
  namespaces?: string[];
  notebooks?: Resource[];
  storageclasses?: string[];
  defaultStorageClass?: string;
  pvcs?: Volume[];
  config?: any;
  poddefaults?: PodDefault[];
  success: boolean;
  log?: string;
}

// Kubernetes API Object for Volumes
export interface Volume {
  namespace: string;
  name: string;
  size: string;
  mode: string;
  path?: string;
  class?: string;
  extraFields?: any;
}

// Kubernetes API Object for VolumeMounts
export interface VolumeMount {
  mountPath: string;
  name: string;
}

// Kubernetes API Object for Notebooks
export interface Resource {
  name: string;
  namespace: string;
  age: string;
  image: string;
  shortImage: string;
  cpu: string;
  gpu: string;
  gpuvendor: string;
  memory: string;
  volumes: VolumeMount[];
  status: string;
  reason: string;
  stopped: boolean;
}

// Kubernetes API Object for PodDefaults
export interface PodDefault {
  label: string;
  desc: string;
}

// ------------------------
// Config Types
// ------------------------
// Spawner UI Config `spawner_ui_config.yaml`
export interface Config {
  image?: {
    value: string;
    options: string[];
    readOnly?: boolean;
  };

  cpu?: {
    value: string;
    setLimit?: boolean;
    readOnly?: boolean;
  };

  memory?: {
    value: string;
    setLimit?: boolean;
    readOnly?: boolean;
  };

  gpus?: {
    value: ConfigGPU;
    readOnly?: boolean;
  };

  workspaceVolume?: {
    value: ConfigVolume;
    readOnly?: boolean;
  };

  dataVolumes?: {
    value: {
      value: ConfigVolume;
    }[];
    default: ConfigVolume
    readOnly?: boolean;
  };

  affinityConfig?: {
    value: string;
    options: AffinityConfig[];
    readOnly?: boolean;
  };

  tolerationGroup?: {
    value: string;
    options: TolerationGroup[];
    readOnly?: boolean;
  };

  configurations?: {
    value: string[];
    readOnly?: boolean;
  };

  shm?: {
    value: boolean;
    readOnly?: boolean;
  };
}

export interface ConfigVolume {
  type: {
    value: string;
  };
  name: {
    value: string;
  };
  size: {
    value: string;
  };
  mountPath: {
    value: string;
    readOnly?: boolean;
  };
  accessModes: {
    value: string;
  };
  class: {
    value: string;
  };
}

export interface ConfigGPU {
  num: string;
  nums: string[];
  vendor: string;
  vendors: GPUVendor[];
}

export interface GPUVendor {
  limitsKey: string;
  uiName: string;
}

export interface AffinityConfig {
  configKey: string;
  displayName: string;
  affinity: object;
}

export interface TolerationGroup {
  groupKey: string;
  displayName: string;
  tolerations: Toleration[];
}

export interface Toleration {
  key: string;
  operator: string;
  value: string;
  effect: string;
  tolerationSeconds?: number;
}
