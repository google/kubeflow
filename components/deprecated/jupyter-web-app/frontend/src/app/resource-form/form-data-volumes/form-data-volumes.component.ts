import { Component, OnInit, Input } from "@angular/core";
import { FormGroup, FormArray, Validators, FormBuilder } from "@angular/forms";
import { Volume } from "src/app/utils/types";
import { addDataVolume } from "src/app/utils/common";

@Component({
  selector: "app-form-data-volumes",
  templateUrl: "./form-data-volumes.component.html",
  styleUrls: [
    "../resource-form.component.scss",
    "./form-data-volumes.component.scss"
  ]
})
export class FormDataVolumesComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() readonly: boolean;
  @Input() pvcs: Volume[];
  @Input() defaultStorageClass: boolean;

  get datavols() {
    const vols = this.parentForm.get("datavols") as FormArray;
    return vols.controls;
  }

  constructor() {}

  ngOnInit() {}

  addVol() {
    addDataVolume(this.parentForm);
  }

  deleteVol(idx: number) {
    const vols = this.parentForm.get("datavols") as FormArray;
    vols.removeAt(idx);
    this.parentForm.updateValueAndValidity();
  }
}
