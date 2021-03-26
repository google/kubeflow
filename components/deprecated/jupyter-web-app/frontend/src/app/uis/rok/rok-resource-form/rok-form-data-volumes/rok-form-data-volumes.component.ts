import { Component, OnInit, Input } from "@angular/core";
import { FormGroup, FormArray, FormBuilder } from "@angular/forms";
import { addRokDataVolume } from "src/app/uis/rok/utils/common";
import { Volume } from "src/app/utils/types";

@Component({
  selector: "app-rok-form-data-volumes",
  templateUrl: "./rok-form-data-volumes.component.html",
  styleUrls: [
    "../../../../resource-form/resource-form.component.scss",
    "./rok-form-data-volumes.component.scss"
  ]
})
export class RokFormDataVolumesComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() readonly: boolean;
  @Input() pvcs: Volume[];
  @Input() storageClasses: string[];
  @Input() token: string;

  get datavols() {
    const vols = this.parentForm.get("datavols") as FormArray;
    return vols.controls;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {}

  addVol() {
    addRokDataVolume(this.parentForm);
  }

  deleteVol(idx: number) {
    const vols = this.parentForm.get("datavols") as FormArray;
    vols.removeAt(idx);
    this.parentForm.updateValueAndValidity();
  }
}
