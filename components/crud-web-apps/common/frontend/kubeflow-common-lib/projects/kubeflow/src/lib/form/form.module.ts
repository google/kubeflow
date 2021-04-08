import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  ],
})
export class FormModule {}
