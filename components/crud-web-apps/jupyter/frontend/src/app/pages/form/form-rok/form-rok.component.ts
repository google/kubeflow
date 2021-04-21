import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '@app/environment';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { Config, Volume, NotebookFormObject } from 'src/app/types';
import {
  NamespaceService,
  BackendService,
  SnackBarService,
  SnackType,
  getNameError,
  rokUrlValidator,
  RokService,
} from 'kubeflow';
import { Router } from '@angular/router';
import { getFormDefaults, initFormControls } from '../form-default/utils';
import { JWABackendService } from 'src/app/services/backend.service';
import { FormDefaultComponent } from '../form-default/form-default.component';

@Component({
  selector: 'app-form-rok',
  templateUrl: './form-rok.component.html',
  styleUrls: [
    './form-rok.component.scss',
    '../form-default/form-default.component.scss',
  ],
})
export class FormRokComponent
  extends FormDefaultComponent
  implements OnInit, OnDestroy {
  env = environment;

  constructor(
    public ns: NamespaceService,
    public backend: JWABackendService,
    public router: Router,
    public popup: SnackBarService,
    public rok: RokService,
  ) {
    super(ns, backend, router, popup);
  }

  ngOnInit() {
    super.ngOnInit();

    this.rok.initCSRF();
  }

  // Form handling functions
  getFormDefaults() {
    // Init the form
    const formCtrl: FormGroup = getFormDefaults();

    // Add labUrl control
    formCtrl.addControl(
      'environment',
      new FormControl('', [Validators.required]),
    );

    // Add the rokUrl control
    const wsExtras: FormGroup = formCtrl.get(
      'workspace.extraFields',
    ) as FormGroup;
    wsExtras.addControl('rokUrl', new FormControl('', []));

    return formCtrl;
  }

  initFormControls(formCtrl: FormGroup, config: Config) {
    // Sets the values from our internal dict. This is an initialization step
    // that should be only run once
    initFormControls(formCtrl, config);

    // Handle the Pod environment
    if (config.environment && config.environment.value) {
      const envVal = JSON.stringify(config.environment.value);
      formCtrl.controls.environment.setValue(envVal);
    } else {
      formCtrl.controls.environment.setValue('{}');
    }
    if (config.environment && config.environment.readOnly) {
      formCtrl.controls.environment.disable();
    }

    // Configure workspace control with rokUrl
    const extraFields: FormGroup = formCtrl
      .get('workspace')
      .get('extraFields') as FormGroup;
    extraFields.addControl('rokUrl', new FormControl('', []));

    // Add rok url control to the data volumes
    const array = formCtrl.get('datavols') as FormArray;
    for (let i = 0; i < this.config.dataVolumes.value.length; i++) {
      const extra = array.at(i).get('extraFields') as FormGroup;
      extra.addControl('rokUrl', new FormControl('', []));
    }
  }
}
