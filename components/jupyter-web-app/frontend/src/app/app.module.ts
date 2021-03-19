import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { FaIconLibrary, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  faBook,
  faBullseye,
  faCheckSquare,
  faCogs,
  faHdd,
  faLaptopCode,
  faLink,
  faMicrochip,
  faSlidersH,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faDocker } from "@fortawesome/free-brands-svg-icons";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { MaterialImportsModule } from "./utils/imports";

import { NamespaceService } from "./services/namespace.service";
import { KubernetesService } from "./services/kubernetes.service";
import { SnackBarService } from "./services/snack-bar.service";

import { MainTableComponent } from "./main-table/main-table.component";
import { NamespaceSelectComponent } from "./main-table/namespace-select/namespace-select.component";
import { ResourceTableComponent } from "./main-table/resource-table/resource-table.component";
import { SnackBarComponent } from "./services/snack-bar/snack-bar.component";
import { ResourceFormComponent } from "./resource-form/resource-form.component";
import { ConfirmDialogComponent } from "./main-table/resource-table/confirm-dialog/confirm-dialog.component";
import { NotebookStatusComponent } from "./main-table/resource-table/notebook-status/notebook-status.component";
import { VolumeComponent } from "./resource-form/volume/volume.component";
import { FormNameComponent } from "./resource-form/form-name/form-name.component";
import { FormImageComponent } from "./resource-form/form-image/form-image.component";
import { FormSpecsComponent } from "./resource-form/form-specs/form-specs.component";
import { FormWorkspaceVolumeComponent } from "./resource-form/form-workspace-volume/form-workspace-volume.component";
import { FormDataVolumesComponent } from "./resource-form/form-data-volumes/form-data-volumes.component";
import { FormAdvancedOptionsComponent } from "./resource-form/form-advanced-options/form-advanced-options.component";
import { RokResourceFormComponent } from "./uis/rok/rok-resource-form/rok-resource-form.component";
import { RokMainTableComponent } from "./uis/rok/rok-main-table/rok-main-table.component";
import { MainTableRouterComponent } from "./uis/multiplexer/main-table-router/main-table-router.component";
import { ResourceFormRouterComponent } from "./uis/multiplexer/resource-form-router/resource-form-router.component";
import { RokJupyterLabSelectorComponent } from "./uis/rok/rok-resource-form/rok-jupyter-lab-selector/rok-jupyter-lab-selector.component";
import { RokVolumeComponent } from "./uis/rok/rok-resource-form/rok-volume/rok-volume.component";
import { RokFormWorkspaceVolumeComponent } from "./uis/rok/rok-resource-form/rok-form-workspace-volume/rok-form-workspace-volume.component";
import { RokFormDataVolumesComponent } from "./uis/rok/rok-resource-form/rok-form-data-volumes/rok-form-data-volumes.component";
import { RokErrorMsgComponent } from "./uis/rok/rok-error-msg/rok-error-msg.component";
import { FormConfigurationsComponent } from "./resource-form/form-configurations/form-configurations.component";
import { FormGpusComponent } from "./resource-form/form-gpus/form-gpus.component";
import { FormTolerationsComponent } from "./resource-form/form-tolerations/form-tolerations.component";
import { FormAffinityComponent } from "./resource-form/form-affinity/form-affinity.component";

@NgModule({
  declarations: [
    AppComponent,
    MainTableComponent,
    NamespaceSelectComponent,
    ResourceTableComponent,
    SnackBarComponent,
    ResourceFormComponent,
    ConfirmDialogComponent,
    NotebookStatusComponent,
    VolumeComponent,
    FormNameComponent,
    FormImageComponent,
    FormSpecsComponent,
    FormWorkspaceVolumeComponent,
    FormDataVolumesComponent,
    FormAdvancedOptionsComponent,
    RokResourceFormComponent,
    RokMainTableComponent,
    MainTableRouterComponent,
    ResourceFormRouterComponent,
    RokJupyterLabSelectorComponent,
    RokVolumeComponent,
    RokFormWorkspaceVolumeComponent,
    RokFormDataVolumesComponent,
    RokErrorMsgComponent,
    FormConfigurationsComponent,
    FormGpusComponent,
    FormTolerationsComponent,
    FormAffinityComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MaterialImportsModule,
    FontAwesomeModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [NamespaceService, KubernetesService, SnackBarService],
  bootstrap: [AppComponent],
  entryComponents: [SnackBarComponent, ConfirmDialogComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCogs,
      faHdd,
      faBook,
      faMicrochip,
      faLaptopCode,
      faDocker,
      faLink,
      faSlidersH,
      faCheckSquare,
      faBullseye,
      faTachometerAlt,
    );
  }
}
