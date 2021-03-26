import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SnackBarComponent } from "./snack-bar/snack-bar.component";
import { SnackType } from "../utils/types";

@Injectable({
  providedIn: "root"
})
export class SnackBarService {
  private dialogState = { shown: false, msg: "" };

  constructor(private snackBar: MatSnackBar) {}

  public open(message: string, type: SnackType, dur: number = 8000) {
    return this.snackBar.openFromComponent(SnackBarComponent, {
      duration: dur,
      data: { msg: message, snackType: type }
    });
  }

  public close() {
    this.dialogState.shown = false;
    this.snackBar.dismiss();
  }

  public show(msg: string, type: SnackType, time = 20000) {
    if (this.dialogState.shown && this.dialogState.msg === msg) {
      return;
    }

    this.dialogState.shown = true;
    this.dialogState.msg = msg;
    this.open(msg, type, time)
      .afterDismissed()
      .subscribe(() => {
        this.dialogState.shown = false;
        this.dialogState.msg = "";
      });
  }
}
