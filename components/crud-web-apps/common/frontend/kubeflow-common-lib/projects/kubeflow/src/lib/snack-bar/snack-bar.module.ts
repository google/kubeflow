import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackBarComponent } from './component/snack-bar.component';

@NgModule({
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  declarations: [SnackBarComponent],
})
export class SnackBarModule {}
