import { PVCResponseObject, PVCProcessedObject } from './backend';
import { STATUS_TYPE } from 'kubeflow';

export interface PVCResponseObjectRok extends PVCResponseObject {
  viewer: STATUS_TYPE;
}

export interface PVCProcessedObjectRok
  extends PVCResponseObjectRok,
    PVCProcessedObject {}
