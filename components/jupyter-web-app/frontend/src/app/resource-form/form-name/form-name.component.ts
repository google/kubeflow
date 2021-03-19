import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { AbstractControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { KubernetesService } from "src/app/services/kubernetes.service";
import { NamespaceService } from "src/app/services/namespace.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-form-name",
  templateUrl: "./form-name.component.html",
  styleUrls: ["./form-name.component.scss", "../resource-form.component.scss"]
})
export class FormNameComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private notebooks: Set<string> = new Set<string>();

  @Input() parentForm: FormGroup;

  showNameError() {
    const nameCtrl = this.parentForm.get("name");

    if (nameCtrl.hasError("existingName")) {
      return `Notebook Server "${nameCtrl.value}" already exists`;
    } else {
      return "Notebook Server name can't be empty";
    }
  }

  private existingName(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const exists = this.notebooks.has(control.value);
      return exists ? {existingName: true} : null;
    };
  }

  constructor(private k8s: KubernetesService,
              private ns: NamespaceService) {
  }

  ngOnInit() {
    // Add the ExistingName validator to the list if it doesn't already exist
    this.parentForm
      .get("name")
      .setValidators([Validators.required, this.existingName()]);

    // Keep track of the existing Notebooks in the selected Namespace
    // Use these names to check if the input name exists
    const nsSub = this.ns.getSelectedNamespace().subscribe(ns => {
      this.k8s.getResource(ns).subscribe(notebooks => {
        this.notebooks.clear();
        notebooks.map(nb => this.notebooks.add(nb.name));
      });
    });
    this.subscriptions.add(nsSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
