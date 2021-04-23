import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatSpinner,
  MatProgressSpinnerModule,
  MatDialogModule,
  MatTooltipModule,
  MatDividerModule,
  MatIconModule,
} from '@angular/material';

import { FormSectionComponent } from './section/section.component';

import { NameNamespaceInputsComponent } from './name-namespace-inputs/name-namespace-inputs.component';
import { NameInputComponent } from './name-namespace-inputs/name-input/name-input.component';
import { IconModule } from '../icon/icon.module';
import { PositiveNumberInputComponent } from './positive-number-input/positive-number-input.component';
import { RokUrlInputComponent } from './rok-url-input/rok-url-input.component';
import { AdvancedOptionsComponent } from './advanced-options/advanced-options.component';
import { PopoverModule } from '../popover/popover.module';
import { SubmitBarComponent } from './submit-bar/submit-bar.component';
import { StepInfoComponent } from './step-info/step-info.component';

import { TranslateLoader, TranslateModule} from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";

@NgModule({
  declarations: [
    FormSectionComponent,
    NameNamespaceInputsComponent,
    NameInputComponent,
    PositiveNumberInputComponent,
    RokUrlInputComponent,
    AdvancedOptionsComponent,
    SubmitBarComponent,
    StepInfoComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDividerModule,
    MatInputModule,
    MatTooltipModule,
    IconModule,
    MatProgressSpinnerModule,
    PopoverModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  exports: [
    FormSectionComponent,
    NameNamespaceInputsComponent,
    NameInputComponent,
    PositiveNumberInputComponent,
    RokUrlInputComponent,
    AdvancedOptionsComponent,
    SubmitBarComponent,
    StepInfoComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatIconModule,
    MatDividerModule,
    TranslateModule
  ],
})
export class FormModule {}

// AOT compilation support
export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "../static/assets/i18n/", ".json");
}
