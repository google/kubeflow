import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NamespaceService } from '../services/namespace.service';
import { KubernetesService } from '../services/kubernetes.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';
import { Volume, Config, SnackType } from '../utils/types';
import { SnackBarService } from '../services/snack-bar.service';
import { getFormDefaults, initFormControls } from '../utils/common';

@Component({
  selector: 'app-resource-form',
  templateUrl: './resource-form.component.html',
  styleUrls: ['./resource-form.component.scss'],
})
export class ResourceFormComponent implements OnInit, OnDestroy {
  currNamespace = '';
  formCtrl: FormGroup;
  config: Config;

  ephemeral = false;
  defaultStorageClass = false;
  formReady = false;
  pvcs: Volume[] = [];

  subscriptions = new Subscription();

  constructor(
    private namespaceService: NamespaceService,
    private k8s: KubernetesService,
    private router: Router,
    private popup: SnackBarService,
  ) {}

  ngOnInit() {
    // Initialize the form control
    this.formCtrl = getFormDefaults();

    // Update the form Values from the default ones
    this.k8s.getConfig().subscribe(config => {
      if (Object.keys(config).length === 0) {
        // Don't fire on empty config
        return;
      }

      this.config = config;
      initFormControls(this.formCtrl, config);
    });

    // Keep track of the selected namespace
    this.subscriptions.add(
      this.namespaceService.getSelectedNamespace().subscribe(namespace => {
        this.currNamespace = namespace;
        this.formCtrl.controls.namespace.setValue(this.currNamespace);

        // Get the PVCs of the new Namespace
        this.k8s.getVolumes(namespace).subscribe(pvcs => {
          this.pvcs = pvcs;
        });
      }),
    );

    // Check if a default StorageClass is set
    this.k8s.getDefaultStorageClass().subscribe(defaultClass => {
      if (defaultClass.length === 0) {
        this.defaultStorageClass = false;
      } else {
        this.defaultStorageClass = true;
      }
    });
  }

  ngOnDestroy() {
    // Unsubscriptions
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    this.k8s
      .postResource(this.formCtrl.getRawValue())
      .pipe(catchError(_ => of('failed')))
      .subscribe(resp => {
        if (resp === 'posted') {
          this.router.navigate(['/']);
        } else if (resp === 'failed') {
          // The Notebook wasn't created, but its volumes might have been created
          this.k8s.getVolumes(this.currNamespace).subscribe(pvcs => {
            this.pvcs = pvcs;
          });
        }
      });
  }
}
