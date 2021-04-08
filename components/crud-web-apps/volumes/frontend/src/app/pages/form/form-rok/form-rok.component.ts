import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import {
  NamespaceService,
  RokService,
  DIALOG_RESP,
  SnackBarService,
  SnackType,
  rokUrlValidator,
  updateNonDirtyControl,
} from 'kubeflow';

import { VWABackendService } from 'src/app/services/backend.service';
import { PVCPostObject } from 'src/app/types';
import { MatDialogRef } from '@angular/material/dialog';
import { FormDefaultComponent } from '../form-default/form-default.component';
import { environment } from '@app/environment';
import { rokStorageClassValidator } from './utils';
import { concatMap } from 'rxjs/operators';

@Component({
  selector: 'app-form-rok',
  templateUrl: './form-rok.component.html',
  styleUrls: [
    '../form-default/form-default.component.scss',
    './form-rok.component.scss',
  ],
})
// TODO: Use an abstract class to eliminate common code
export class FormRokComponent extends FormDefaultComponent
  implements OnInit, OnDestroy {
  public env = environment;

  private rokManagedStorageClasses: string[] = [];

  constructor(
    public ns: NamespaceService,
    public fb: FormBuilder,
    public backend: VWABackendService,
    public dialog: MatDialogRef<FormDefaultComponent>,
    public snack: SnackBarService,
    public rok: RokService,
  ) {
    super(ns, fb, backend, dialog);
  }

  ngOnInit() {
    super.ngOnInit();

    this.formCtrl.get('size').setValue(5);

    this.subs.add(
      this.formCtrl.get('type').valueChanges.subscribe(volType => {
        if (volType === this.TYPE_EMPTY) {
          this.formCtrl.removeControl('snapshot');
          this.formCtrl.get('class').setValidators([Validators.required]);
          updateNonDirtyControl(this.formCtrl.get('size'), 5);
          updateNonDirtyControl(
            this.formCtrl.get('class'),
            this.defaultStorageClass,
          );
        } else {
          // Add a Rok URL control
          this.formCtrl.addControl(
            'snapshot',
            new FormControl(
              '',
              [Validators.required],
              [rokUrlValidator(this.rok)],
            ),
          );

          // Set the size value to none to force the user to handle this field
          updateNonDirtyControl(this.formCtrl.get('size'), null);

          // Ensure that the StorageClass used is provisioned from Rok
          this.formCtrl
            .get('class')
            .setValidators([
              Validators.required,
              rokStorageClassValidator(this.rokManagedStorageClasses),
            ]);
        }

        this.formCtrl.get('class').updateValueAndValidity({ onlySelf: true });
      }),
    );

    // Get the list of Rok managed storage classes
    this.rok.getRokManagedStorageClasses().subscribe(classes => {
      this.rokManagedStorageClasses = classes;

      // update the validators if type is Rok Snapshot
      if (this.formCtrl.get('type').value === this.TYPE_ROK_SNAPSHOT) {
        this.formCtrl
          .get('class')
          .setValidators([
            Validators.required,
            rokStorageClassValidator(this.rokManagedStorageClasses),
          ]);
      }
    });

    this.rok.initCSRF();
  }

  public rokUrlChanged(url: string) {
    this.rok.getObjectMetadata(url).subscribe({
      next: headers => {
        // Autofill the name
        let size = parseInt(headers.get('content-length'), 10);
        size = size / Math.pow(1024, 3);
        this.formCtrl.get('size').setValue(size);
        this.snack.open(
          'Successfully retrieved snapshot information.',
          SnackType.Success,
          3000,
        );
      },
      error: err => {
        this.snack.open(`'${url}' is not a valid Rok URL`, SnackType.Error, -1);
      },
    });
  }

  /*
   * Handle the Storage Classes Select state
   */
  public classIsDisabled(name: string) {
    const volType = this.formCtrl.controls.type.value;
    if (volType !== this.TYPE_ROK_SNAPSHOT) {
      return false;
    }

    if (this.rokManagedStorageClasses.includes(name)) {
      return false;
    }

    return true;
  }

  public classTooltip(name: string) {
    if (!this.classIsDisabled(name)) {
      return '';
    }

    return 'This Storage Class is not backed by Rok';
  }

  public onSubmit() {
    // TODO: Could use a lodash helper instead
    const pvc: PVCPostObject = JSON.parse(JSON.stringify(this.formCtrl.value));
    pvc.size = pvc.size + 'Gi';
    this.blockSubmit = true;

    // Check if the Rok URL is valid
    if (pvc.type === this.TYPE_ROK_SNAPSHOT) {
      this.rok.getObjectMetadata(pvc.snapshot, false).subscribe(headers => {
        this.backend.createPVC(this.currNamespace, pvc).subscribe(result => {
          this.dialog.close(DIALOG_RESP.ACCEPT);
        });
      });

      return;
    }

    this.backend.createPVC(this.currNamespace, pvc).subscribe(result => {
      this.dialog.close(DIALOG_RESP.ACCEPT);
    });
    this.blockSubmit = false;
  }
}
