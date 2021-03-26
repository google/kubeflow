import { Status, BackendResponse } from 'kubeflow';

export interface JWABackendResponse extends BackendResponse {
  notebooks?: NotebookResponseObject[];
  pvcs?: Volume[];
  config?: Config;
  poddefaults?: PodDefault[];
  vendors?: string[];
}

export interface NotebookResponseObject {
  name: string;
  namespace: string;
  status: Status;
  reason: string;
  age: string;
  image: string;
  volumes: string[];
  cpu: string;
  gpus: {
    count: number;
    message: string;
  };
  memory: string;
  environment: string;
  shortImage: string;
}

export interface NotebookProcessedObject extends NotebookResponseObject {
  deleteAction?: string;
  connectAction?: string;
  startStopAction?: string;
}

export interface NotebookFormObject {
  name: string;
  namespace: string;
  image: string;
  imagePullPolicy: string;
  customImage?: string;
  customImageCheck: boolean;
  cpu: number | string;
  memory: number | string;
  gpus: GPU;
  environment?: string;
  noWorkspace: boolean;
  workspace: Volume;
  datavols: Volume[];
  shm: boolean;
  configurations: PodDefault[];
}

export interface Volume {
  name: string;
  size: number;
  namepsace?: string;
  class?: string;
  mode: string;
  type?: string;
  path: string;
  extraFields?: { [key: string]: any };
  templatedName?: string;
}

export function emptyVolume(): Volume {
  return {
    type: '',
    name: '',
    size: 1,
    path: '',
    mode: '',
    extraFields: {},
    templatedName: '',
  };
}

// Types of the Configuration with default values from backend
export interface PodDefault {
  label: string;
  desc: string;
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
  tolerationSeconds?: bigint;
}

export interface GPUVendor {
  limitsKey: string;
  uiName: string;
}

export interface GPU {
  vendor?: string;
  num?: string;
  vendors?: GPUVendor[];
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
  };
  accessModes: {
    value: string;
  };
}

export interface Config {
  image?: {
    value: string;
    options: string[];
    readOnly?: boolean;
    hideRegistry?: boolean;
    hideTag?: boolean;
  };

  imagePullPolicy?: {
    value: string;
    readOnly?: boolean;
  };

  cpu?: {
    value: string;
    readOnly?: boolean;
  };

  memory?: {
    value: string;
    readOnly?: boolean;
  };

  environment?: {
    value: string;
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

  shm?: {
    value: boolean;
    readOnly?: boolean;
  };

  gpus?: {
    value?: GPU;
    readOnly?: boolean;
  };

  configurations?: {
    value: string[];
    readOnly?: boolean;
  };
}
