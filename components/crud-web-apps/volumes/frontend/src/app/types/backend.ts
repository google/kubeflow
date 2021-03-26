import { Status, BackendResponse } from 'kubeflow';

export interface VWABackendResponse extends BackendResponse {
  pvcs?: PVCResponseObject[];
}

export interface PVCResponseObject {
  age: {
    uptime: string;
    timestamp: string;
  };
  capacity: string;
  class: string;
  modes: string[];
  name: string;
  namespace: string;
  status: Status;
}

export interface PVCProcessedObject extends PVCResponseObject {
  deleteAction?: string;
  editAction?: string;
  ageValue?: string;
  ageTooltip?: string;
}

export interface PVCPostObject {
  name: string;
  type: string;
  size: string | number;
  class: string;
  mode: string;
  snapshot: string;
}
