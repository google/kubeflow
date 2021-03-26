import { Component, Inject } from "@angular/core";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { SnackType } from "src/app/utils/types";

@Component({
  selector: "app-snack-bar",
  templateUrl: "./snack-bar.component.html",
  styleUrls: ["./snack-bar.component.scss"]
})
export class SnackBarComponent {
  constructor(
    public snackBarRef: MatSnackBarRef<SnackBarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) {}

  get icon() {
    switch (this.data.snackType) {
      case SnackType.Success:
        return "done";
      case SnackType.Error:
        return "clear";
      case SnackType.Warning:
        return "warning";
      case SnackType.Info:
        return "info";
    }
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}
