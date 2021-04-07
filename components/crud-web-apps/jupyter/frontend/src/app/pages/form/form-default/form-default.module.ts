import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { FormDefaultComponent } from './form-default.component';
import { FormNameComponent } from './form-name/form-name.component';
import { FormImageComponent } from './form-image/form-image.component';
import { FormCpuRamComponent } from './form-cpu-ram/form-cpu-ram.component';
import { FormGpusComponent } from './form-gpus/form-gpus.component';
import { FormAdvancedOptionsComponent } from './form-advanced-options/form-advanced-options.component';

import {
  FormModule as KfFormModule,
  ImmediateErrorStateMatcher,
} from 'kubeflow';
import { FormWorkspaceVolumeComponent } from './form-workspace-volume/form-workspace-volume.component';
import { VolumeComponent } from './volume/volume.component';
import { FormDataVolumesComponent } from './form-data-volumes/form-data-volumes.component';
import { FormConfigurationsComponent } from './form-configurations/form-configurations.component';
import { FormAffinityTolerationsComponent } from './form-affinity-tolerations/form-affinity-tolerations.component';

import { TranslateLoader, TranslateModule} from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";

@NgModule({
  declarations: [
    FormDefaultComponent,
    FormNameComponent,
    FormImageComponent,
    FormCpuRamComponent,
    FormWorkspaceVolumeComponent,
    FormDataVolumesComponent,
    VolumeComponent,
    FormGpusComponent,
    FormAdvancedOptionsComponent,
    FormConfigurationsComponent,
    FormAffinityTolerationsComponent,
  ],
  imports: [
    CommonModule,
    KfFormModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonToggleModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  exports: [
    FormDefaultComponent,
    FormNameComponent,
    FormImageComponent,
    FormCpuRamComponent,
    FormWorkspaceVolumeComponent,
    FormDataVolumesComponent,
    VolumeComponent,
    FormGpusComponent,
    FormAdvancedOptionsComponent,
    FormConfigurationsComponent,
    FormAffinityTolerationsComponent,
  ],
})
export class FormDefaultModule {}

// AOT compilation support
export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "../static/assets/i18n/", ".json");
}

