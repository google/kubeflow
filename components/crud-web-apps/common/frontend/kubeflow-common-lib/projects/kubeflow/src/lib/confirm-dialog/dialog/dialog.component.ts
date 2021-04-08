import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogConfig, DIALOG_RESP } from '../types';
import { Subject } from 'rxjs';

@Component({
  selector: 'lib-confirm-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnInit {
  public DIALOG_RESP = DIALOG_RESP;
  public isApplying = false;
  public applying$ = new Subject<boolean>();

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: DialogConfig,
  ) {}

  ngOnInit() {
    this.applying$.subscribe(b => {
      this.isApplying = b;
    });
  }

  onAcceptClicked(): void {
    this.isApplying = true;
    this.applying$.next(true);
  }

  onCancelClicked(): void {
    this.dialogRef.close(DIALOG_RESP.CANCEL);
  }
}
