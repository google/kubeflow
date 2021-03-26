import { Component } from '@angular/core';
import { TableColumnComponent } from 'kubeflow/lib/resource-table/component-value/component-value.component';
import { NotebookProcessedObject } from 'src/app/types';
import { environment } from '@app/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

@Component({
  selector: 'app-server-type',
  templateUrl: './server-type.component.html',
  styleUrls: ['./server-type.component.scss']
})
export class ServerTypeComponent implements TableColumnComponent {

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon('jupyterlab-icon', sanitizer.bypassSecurityTrustResourceUrl(environment.jupyterIcon));
    iconRegistry.addSvgIcon('vs-code-icon', sanitizer.bypassSecurityTrustResourceUrl(environment.vscodeIcon));
    iconRegistry.addSvgIcon('rstudio-icon', sanitizer.bypassSecurityTrustResourceUrl(environment.rstudioIcon));
  }

  notebookServerType: string;

  set element(notebook: NotebookProcessedObject) {
    this.notebookServerType = notebook.serverType
  }

}

