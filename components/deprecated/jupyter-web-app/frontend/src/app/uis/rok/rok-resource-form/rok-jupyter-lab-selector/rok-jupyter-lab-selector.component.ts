import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FormGroup, FormArray, FormBuilder } from "@angular/forms";
import { RokService } from "../../services/rok.service";
import { SnackType } from "src/app/utils/types";
import { SnackBarService } from "src/app/services/snack-bar.service";
import { addRokDataVolume } from "../../utils/common";
import { JupyterLab } from "../../utils/types";

@Component({
  selector: "app-rok-jupyter-lab-selector",
  templateUrl: "./rok-jupyter-lab-selector.component.html",
  styleUrls: [
    "./rok-jupyter-lab-selector.component.scss",
    "../../../../resource-form/resource-form.component.scss"
  ]
})
export class RokJupyterLabSelectorComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() token: string;

  constructor(
    private rok: RokService,
    private popup: SnackBarService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {}

  autofillJupyterLab() {
    // Fill the Form from the values of the Rok Jupyter Lab Snapshot
    const url: string = this.parentForm.value.labUrl;

    if (url.length === 0) {
      this.popup.show(
        "The Rok Jupyter Lab URL can not be empty.",
        SnackType.Info
      );
      return;
    }

    this.rok.getJupyterLab(url, this.token).subscribe(lab => {
      this.setLabValues(lab);

      const msg = "Successfully retrieved details from Rok Jupyter Lab URL";
      this.popup.show(msg, SnackType.Success, 4000);
    });
  }

  setLabValues(lab: JupyterLab) {
    this.parentForm.get("customImage").setValue(lab.image.trim());
    this.parentForm.get("customImageCheck").setValue(true);
    this.parentForm.get("cpu").setValue(lab.cpu);
    this.parentForm.get("memory").setValue(lab.memory);

    // Set the workspace volume
    this.parentForm
      .get("workspace")
      .get("extraFields")
      .get("rokUrl")
      .setValue(lab.wsvolume.extraFields["rokUrl"]);
    this.parentForm
      .get("workspace")
      .get("type")
      .setValue("Existing");

    // Set the data volumes
    if (this.parentForm.value.datavols.length < lab.dtvolumes.length) {
      // add volume controls until we have the necessary number of data
      // volume controls
      const diff = lab.dtvolumes.length - this.parentForm.value.datavols.length;
      for (let i = 0; i < diff; i++) {
        addRokDataVolume(this.parentForm);
      }
    }

    // Set each volume to existing type
    const volsArr = this.parentForm.get("datavols") as FormArray;
    for (let i = 0; i < lab.dtvolumes.length; i++) {
      volsArr
        .at(i)
        .get("extraFields")
        .get("rokUrl")
        .setValue(lab.dtvolumes[i].extraFields["rokUrl"]);

      volsArr
        .at(i)
        .get("type")
        .setValue("Existing");
    }
  }
}
