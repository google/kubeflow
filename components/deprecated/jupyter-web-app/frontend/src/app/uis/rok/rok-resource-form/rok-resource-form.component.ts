import { Component, OnInit } from "@angular/core";
import { RokService } from "../services/rok.service";
import { RokToken, EMPTY_TOKEN } from "src/app/uis/rok/utils/types";
import { Subscription, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { Volume, Config } from "src/app/utils/types";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  FormArray
} from "@angular/forms";
import { NamespaceService } from "src/app/services/namespace.service";
import { KubernetesService } from "src/app/services/kubernetes.service";
import { Router } from "@angular/router";
import { getFormDefaults, initFormControls } from "src/app/utils/common";

@Component({
  selector: "app-rok-resource-form",
  templateUrl: "./rok-resource-form.component.html",
  styleUrls: ["./rok-resource-form.component.scss"]
})
export class RokResourceFormComponent implements OnInit {
  subscriptions: Subscription = new Subscription();
  token: RokToken = EMPTY_TOKEN;

  currNamespace = "";
  formCtrl: FormGroup;
  config: Config;

  ephemeral = false;
  defaultStorageclass = false;
  storageClasses: string[] = [];
  formReady = false;
  pvcs: Volume[] = [];

  constructor(
    private namespaceService: NamespaceService,
    private k8s: KubernetesService,
    private fb: FormBuilder,
    private router: Router,
    private rok: RokService
  ) {}

  ngOnInit() {
    // Init the form
    this.formCtrl = getFormDefaults();

    // Add labUrl control
    this.formCtrl.addControl("labUrl", new FormControl("", []));

    // Add the rokUrl control
    const ws: FormGroup = this.formCtrl.get("workspace") as FormGroup;
    ws.controls.extraFields = this.fb.group({
      rokUrl: ["", [Validators.required]]
    });

    // Get the user's Rok Secret
    this.rok
      .getRokSecret("kubeflow")
      .pipe(catchError(_ => of({ name: "rok-token-name", value: "" })))
      .subscribe(token => {
        this.token = token;
      });

    // Update the form Values from the default ones
    this.k8s.getConfig().subscribe(config => {
      if (Object.keys(config).length === 0) {
        // Don't fire on empty config
        return;
      }

      this.config = config;
      this.initRokFormControls();
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
      })
    );

    // Check if a default StorageClass is set
    this.k8s.getDefaultStorageClass().subscribe(defaultClass => {
      if (defaultClass.length === 0) {
        this.defaultStorageclass = false;
      } else {
        this.defaultStorageclass = true;
      }
    });

    // Get a list of existin StorageClasses
    this.k8s.getStorageClasses().subscribe(classes => {
      this.storageClasses = classes;
    });
  }

  ngOnDestroy() {
    // Unsubscriptions
    this.subscriptions.unsubscribe();
  }

  public initRokFormControls() {
    // Sets the values from our internal dict. This is an initialization step
    // that should be only run once
    initFormControls(this.formCtrl, this.config);

    // Configure workspace control with rokUrl
    const extraFields: FormGroup = this.formCtrl
      .get("workspace")
      .get("extraFields") as FormGroup;
    extraFields.addControl("rokUrl", new FormControl("", []));

    // Add rok url control to the data volumes
    const array = this.formCtrl.get("datavols") as FormArray;
    for (let i = 0; i < this.config.dataVolumes.value.length; i++) {
      const extra = array.at(i).get("extraFields") as FormGroup;
      extra.addControl("rokUrl", new FormControl("", []));
    }
  }

  public onSubmit() {
    this.k8s
      .postResource(this.formCtrl.value)
      .pipe(catchError(_ => of("failed")))
      .subscribe(resp => {
        if (resp === "posted") {
          this.router.navigate(["/"]);
        } else if (resp === "failed") {
          // The Notebook wasn't created, but its volumes might have been created
          this.k8s.getVolumes(this.currNamespace).subscribe(pvcs => {
            this.pvcs = pvcs;
          });
        }
      });
  }
}
