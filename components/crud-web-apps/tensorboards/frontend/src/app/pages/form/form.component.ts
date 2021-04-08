import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { NamespaceService, DIALOG_RESP } from 'kubeflow';
import { TWABackendService } from 'src/app/services/backend.service';
import { TensorboardPostObject } from 'src/app/types';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit, OnDestroy {
  public subs = new Subscription();
  public formCtrl: FormGroup;
  public blockSubmit = false;

  public currNamespace = '';
  public tensorboardNames = new Set<string>();
  public pvcNames: string[] = [];
  public storageType = 'object_store';

  constructor(
    public ns: NamespaceService,
    public fb: FormBuilder,
    public backend: TWABackendService,
    public dialog: MatDialogRef<FormComponent>,
  ) {
    this.formCtrl = this.fb.group({
      name: ['', [Validators.required]],
      namespace: ['', [Validators.required]],
      storage: ['object_store', [Validators.required]],
      objectStoreLink: ['', [Validators.required]],
      pvcName: ['', [Validators.nullValidator]],
      pvcMountPath: ['', [Validators.nullValidator]],
    });
  }

  ngOnInit() {
    this.formCtrl.controls.namespace.disable();

    this.subs.add(
      this.ns.getSelectedNamespace().subscribe(ns => {
        this.currNamespace = ns;
        this.formCtrl.controls.namespace.setValue(ns);

        this.backend.getTensorboards(ns).subscribe(tensorboards => {
          this.tensorboardNames.clear();
          tensorboards.forEach(tensorboard =>
            this.tensorboardNames.add(tensorboard.name),
          );
        });
      }),
    );

    this.subs.add(
      this.formCtrl.get('storage').valueChanges.subscribe(stType => {
        this.storageType = stType;
        if (stType === 'pvc') {
          this.backend.getPVCNames(this.currNamespace).subscribe(pvcs => {
            this.pvcNames = pvcs;
          });

          this.formCtrl.removeControl('objectStoreLink');
          this.formCtrl.addControl(
            'pvcName',
            new FormControl('', [Validators.required]),
          );
        }
        if (stType === 'object_store') {
          this.formCtrl.removeControl('pvcName');
          this.formCtrl.addControl(
            'objectStoreLink',
            new FormControl('', [Validators.required]),
          );
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  public onSubmit() {
    let logspath: string;
    if (this.storageType === 'pvc') {
      logspath =
        'pvc://' +
        this.formCtrl.get('pvcName').value +
        '/' +
        this.formCtrl.get('pvcMountPath').value;
    } else {
      logspath = this.formCtrl.get('objectStoreLink').value;
    }

    const tensorboard: TensorboardPostObject = JSON.parse(
      JSON.stringify({
        name: this.formCtrl.get('name').value,
        namespace: this.formCtrl.get('namespace').value,
        logspath: logspath,
      }),
    );

    this.blockSubmit = true;

    this.backend.createTensorboard(this.currNamespace, tensorboard).subscribe(
      result => {
        this.dialog.close(DIALOG_RESP.ACCEPT);
      },
      error => {
        this.blockSubmit = false;
      },
    );
  }

  public onCancel() {
    this.dialog.close(DIALOG_RESP.CANCEL);
  }
}
