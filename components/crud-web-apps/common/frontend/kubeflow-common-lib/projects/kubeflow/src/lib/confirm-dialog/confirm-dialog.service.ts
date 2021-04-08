import { Injectable } from '@angular/core';
import { ConfirmDialogModule } from './confirm-dialog.module';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './dialog/dialog.component';
import { DialogConfig } from './types';

@Injectable({
  providedIn: ConfirmDialogModule,
})
export class ConfirmDialogService {
  constructor(private dialog: MatDialog) {}

  public open(rsrcName: string, config: DialogConfig) {
    return this.dialog.open(ConfirmDialogComponent, {
      width: config.width || 'fit-content',
      data: config,
    });
  }
}
