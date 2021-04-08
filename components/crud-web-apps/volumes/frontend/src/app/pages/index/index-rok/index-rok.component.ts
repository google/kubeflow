import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  NamespaceService,
  ConfirmDialogService,
  DIALOG_RESP,
  SnackBarService,
  SnackType,
  RokService,
  ActionEvent,
  STATUS_TYPE,
} from 'kubeflow';
import { environment } from '@app/environment';
import { VWABackendService } from 'src/app/services/backend.service';
import { IndexDefaultComponent } from '../index-default/index-default.component';
import { FormRokComponent } from '../../form/form-rok/form-rok.component';
import { rokConfig } from './config';
import { PVCProcessedObjectRok, PVCResponseObjectRok } from 'src/app/types';

@Component({
  selector: 'app-index-rok',
  templateUrl: '../index-default/index-default.component.html',
  styleUrls: ['../index-default/index-default.component.scss'],
})
export class IndexRokComponent extends IndexDefaultComponent implements OnInit {
  config = rokConfig;

  constructor(
    public ns: NamespaceService,
    public confirmDialog: ConfirmDialogService,
    public backend: VWABackendService,
    public dialog: MatDialog,
    public snackBar: SnackBarService,
    public rok: RokService,
  ) {
    super(ns, confirmDialog, backend, dialog, snackBar);
  }

  ngOnInit() {
    super.ngOnInit();

    this.rok.initCSRF();
  }

  // Functions for handling the action events
  public newResourceClicked() {
    const ref = this.dialog.open(FormRokComponent, {
      width: '600px',
      panelClass: 'form--dialog-padding',
    });

    ref.afterClosed().subscribe(res => {
      if (res === DIALOG_RESP.ACCEPT) {
        this.snackBar.open(
          'Volume was submitted successfully.',
          SnackType.Success,
          2000,
        );
        this.poller.reset();
      }
    });
  }

  public reactToAction(a: ActionEvent) {
    super.reactToAction(a);

    switch (a.action) {
      case 'edit':
        this.editClicked(a.data);
        break;
    }
  }

  public editClicked(pvc: PVCProcessedObjectRok) {
    if (pvc.viewer === STATUS_TYPE.READY) {
      this.openEditWindow(pvc);
      return;
    }

    this.pvcsWaitingViewer.add(pvc.name);
    pvc.editAction = this.parseViewerActionStatus(pvc);

    this.backend.createViewer(this.currNamespace, pvc.name).subscribe({
      next: res => {
        this.poller.reset();
      },
      error: err => {
        this.pvcsWaitingViewer.delete(pvc.name);
        pvc.editAction = this.parseViewerActionStatus(pvc);
      },
    });
  }

  // Utility funcs
  public parseIncomingData(
    pvcs: PVCResponseObjectRok[],
  ): PVCProcessedObjectRok[] {
    const parsedPVCs = [];
    for (const pvc of super.parseIncomingData(pvcs)) {
      const parsedPVC = pvc as PVCProcessedObjectRok;

      parsedPVC.editAction = this.parseViewerActionStatus(parsedPVC);
      parsedPVCs.push(parsedPVC);
    }

    return parsedPVCs;
  }

  public parseViewerActionStatus(pvc: PVCProcessedObjectRok): STATUS_TYPE {
    // If the PVC is being created or there was an error, then
    // don't allow the user to edit it
    if (
      pvc.status.phase === STATUS_TYPE.UNINITIALIZED ||
      pvc.status.phase === STATUS_TYPE.WAITING ||
      pvc.status.phase === STATUS_TYPE.WARNING ||
      pvc.status.phase === STATUS_TYPE.TERMINATING ||
      pvc.status.phase === STATUS_TYPE.ERROR
    ) {
      return STATUS_TYPE.UNAVAILABLE;
    }

    // The PVC is either READY or UNAVAILABLE(WaitForFirstConsumer)

    // If the user had clicked to view the files and the viewer just
    // became ready, then open the edit window
    if (
      this.pvcsWaitingViewer.has(pvc.name) &&
      pvc.viewer === STATUS_TYPE.READY
    ) {
      this.pvcsWaitingViewer.delete(pvc.name);
      this.openEditWindow(pvc);
      return STATUS_TYPE.READY;
    }

    // If the user clicked to view the files and the viewer
    // is stil uninitialized or unavailable, then show a spinner
    if (
      this.pvcsWaitingViewer.has(pvc.name) &&
      (pvc.viewer === STATUS_TYPE.UNINITIALIZED ||
        pvc.viewer === STATUS_TYPE.WAITING)
    ) {
      return STATUS_TYPE.WAITING;
    }

    // If the user hasn't yet clicked to edit the pvc, then the viewer
    // button should be enabled
    if (
      !this.pvcsWaitingViewer.has(pvc.name) &&
      pvc.status.state === 'WaitForFirstConsumer'
    ) {
      return STATUS_TYPE.UNINITIALIZED;
    }

    return pvc.viewer;
  }

  public openEditWindow(pvc: PVCProcessedObjectRok) {
    const url =
      this.env.viewerUrl + `/volume/browser/${pvc.namespace}/${pvc.name}/`;

    window.open(url, `${pvc.name}: Edit file contents`, 'height=600,width=800');
  }
}
