import { Component, Input, OnInit } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { ConfigVolume, Volume } from "src/app/utils/types";
import { appendDataVolumeControl } from "src/app/utils/common";

@Component({
  selector: "app-form-data-volumes",
  templateUrl: "./form-data-volumes.component.html",
  styleUrls: [
    "../resource-form.component.scss",
    "./form-data-volumes.component.scss"
  ]
})
export class FormDataVolumesComponent implements OnInit {
  private _volumeId: number = 0

  @Input() parentForm: FormGroup;
  @Input() pvcs: Volume[];
  @Input() defaultVolumeConfig: ConfigVolume;
  @Input() defaultStorageClass: boolean;
  @Input() readonly: boolean;

  get datavols() {
    const vols = this.parentForm.controls.datavols as FormArray;
    return vols.controls;
  }

  addVol() {
    const vols = this.parentForm.controls.datavols as FormArray;
    appendDataVolumeControl(vols, this.defaultVolumeConfig, String(this._volumeId));
    this._volumeId++
  }

  deleteVol(idx: number) {
    const vols = this.parentForm.controls.datavols as FormArray;
    vols.removeAt(idx);
    this.parentForm.updateValueAndValidity();
  }

  constructor() {
  }

  ngOnInit() {
  }

}
