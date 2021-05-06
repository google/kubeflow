import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NamespaceSelectComponent } from './namespace-select.component';
import { SnackBarModule } from '../snack-bar/snack-bar.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatSelectModule,
    SnackBarModule,
    TranslateModule,
  ],
  declarations: [NamespaceSelectComponent],
  exports: [NamespaceSelectComponent],
})
export class NamespaceSelectModule {}
