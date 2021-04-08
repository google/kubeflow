import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  NamespaceService,
  ActionEvent,
  ConfirmDialogService,
  ExponentialBackoff,
  STATUS_TYPE,
  DIALOG_RESP,
  DialogConfig,
  SnackBarService,
  SnackType,
} from 'kubeflow';
import { defaultConfig } from './config';
import { environment } from '@app/environment';
import { TWABackendService } from 'src/app/services/backend.service';
import {
  TensorboardResponseObject,
  TensorboardProcessedObject,
} from 'src/app/types';
import { Subscription } from 'rxjs';
import { isEqual } from 'lodash';
import { FormComponent } from '../form/form.component';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent implements OnInit {
  public env = environment;
  public poller: ExponentialBackoff;

  public currNamespace = '';
  public subs = new Subscription();

  public config = defaultConfig;
  public rawData: TensorboardResponseObject[] = [];
  public processedData: TensorboardProcessedObject[] = [];

  constructor(
    public ns: NamespaceService,
    public confirmDialog: ConfirmDialogService,
    public backend: TWABackendService,
    public dialog: MatDialog,
    public snackBar: SnackBarService,
  ) {}

  ngOnInit() {
    this.poller = new ExponentialBackoff({ interval: 1000, retries: 3 });

    // Poll for new data and reset the poller if different data is found
    this.subs.add(
      this.poller.start().subscribe(() => {
        if (!this.currNamespace) {
          return;
        }

        this.backend
          .getTensorboards(this.currNamespace)
          .subscribe(tensorboards => {
            if (!isEqual(this.rawData, tensorboards)) {
              this.rawData = tensorboards;

              // Update the frontend's state
              this.processedData = this.processIncomingData(tensorboards);
              this.poller.reset();
            }
          });
      }),
    );

    // Reset the poller whenever the selected namespace changes
    this.subs.add(
      this.ns.getSelectedNamespace().subscribe(ns => {
        this.currNamespace = ns;
        this.poller.reset();
      }),
    );
  }

  public reactToAction(a: ActionEvent) {
    switch (a.action) {
      case 'newResourceButton':
        this.newResourceClicked();
        break;
      case 'delete':
        this.deleteTensorboardClicked(a.data);
        break;
      case 'connect':
        this.connectResource(a.data);
        break;
    }
  }

  public newResourceClicked() {
    const ref = this.dialog.open(FormComponent, {
      width: '600px',
      panelClass: 'form--dialog-padding',
    });

    ref.afterClosed().subscribe(res => {
      if (res === DIALOG_RESP.ACCEPT) {
        this.snackBar.open(
          'Tensorboard was submitted successfully.',
          SnackType.Success,
          2000,
        );
        this.poller.reset();
      }
    });
  }

  public deleteTensorboardClicked(tensorboard: TensorboardProcessedObject) {
    const deleteDialogConfig: DialogConfig = {
      title: `Are you sure you want to delete this Tensorboard : ${tensorboard.name} ?`,
      message: '',
      accept: 'DELETE',
      confirmColor: 'warn',
      cancel: 'CANCEL',
      error: '',
      applying: 'DELETING',
      width: '600px',
    };

    const ref = this.confirmDialog.open(tensorboard.name, deleteDialogConfig);
    const delSub = ref.componentInstance.applying$.subscribe(applying => {
      if (!applying) {
        return;
      }

      // Close the open dialog only if the DELETE request succeeded
      this.backend
        .deleteTensorboard(this.currNamespace, tensorboard.name)
        .subscribe({
          next: _ => {
            this.poller.reset();
            ref.close(DIALOG_RESP.ACCEPT);
          },
          error: err => {
            const errorMsg = err;
            console.log(err);
            deleteDialogConfig.error = errorMsg;
            ref.componentInstance.applying$.next(false);
          },
        });

      // DELETE request has succeeded
      ref.afterClosed().subscribe(res => {
        delSub.unsubscribe();
        if (res !== DIALOG_RESP.ACCEPT) {
          return;
        }

        tensorboard.status.phase = STATUS_TYPE.TERMINATING;
        tensorboard.status.message =
          'Preparing to delete the Tensorboard object...';
        tensorboard.deleteAction = STATUS_TYPE.UNAVAILABLE;
      });
    });
  }

  public connectResource(tensorboard: TensorboardProcessedObject): void {
    window.open(`/tensorboard/${tensorboard.namespace}/${tensorboard.name}/`);
  }

  //Utility functions
  public processIncomingData(
    tensorboards: TensorboardResponseObject[],
  ): TensorboardProcessedObject[] {
    const tensorboardsCopy = JSON.parse(
      JSON.stringify(tensorboards),
    ) as TensorboardProcessedObject[];

    for (const tensorboard of tensorboardsCopy) {
      this.processDeletionActionStatus(tensorboard);
      this.processConnectionActionStatus(tensorboard);
      this.processAgeField(tensorboard);
    }
    return tensorboardsCopy;
  }

  public processAgeField(tensorboard: TensorboardProcessedObject) {
    tensorboard.ageValue = tensorboard.age.uptime;
    tensorboard.ageTooltip = tensorboard.age.timestamp;
  }

  public processDeletionActionStatus(tensorboard: TensorboardProcessedObject) {
    if (tensorboard.status.phase !== STATUS_TYPE.TERMINATING) {
      tensorboard.deleteAction = STATUS_TYPE.READY;
      return;
    }

    tensorboard.deleteAction = STATUS_TYPE.TERMINATING;
  }

  public processConnectionActionStatus(
    tensorboard: TensorboardProcessedObject,
  ) {
    if (tensorboard.status.phase === STATUS_TYPE.READY) {
      tensorboard.connectAction = STATUS_TYPE.READY;
      return;
    }
    tensorboard.connectAction = STATUS_TYPE.UNAVAILABLE;
  }

  public tensorboardTrackByFn(
    index: number,
    tensorboard: TensorboardProcessedObject,
  ) {
    return `${tensorboard.name}/${tensorboard.namespace}/${tensorboard.logspath}`;
  }
}
