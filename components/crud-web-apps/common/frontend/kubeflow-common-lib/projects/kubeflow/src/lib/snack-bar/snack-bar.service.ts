import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from './component/snack-bar.component';
import { SnackType } from './types';

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  private dialogState = { shown: false, msg: '' };

  constructor(private snackBar: MatSnackBar) {}

  private show(message: string, type: SnackType, dur: number = 8000) {
    return this.snackBar.openFromComponent(SnackBarComponent, {
      duration: dur,
      data: { msg: message, snackType: type },
    });
  }

  public close() {
    this.dialogState.shown = false;
    this.snackBar.dismiss();
  }

  public open(msg: string, type: SnackType, time = 20000) {
    if (this.dialogState.shown && this.dialogState.msg === msg) {
      return;
    }

    this.dialogState.shown = true;
    this.dialogState.msg = msg;
    this.show(msg, type, time)
      .afterDismissed()
      .subscribe(() => {
        this.dialogState.shown = false;
        this.dialogState.msg = '';
      });
  }
}
