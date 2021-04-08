import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import {
  ResourceTableModule,
  NamespaceSelectModule,
  ConfirmDialogModule,
  FormModule,
  ImmediateErrorStateMatcher,
  KubeflowModule,
} from 'kubeflow';

import { IndexComponent } from './pages/index/index.component';
import { FormComponent } from './pages/form/form.component';

@NgModule({
  declarations: [AppComponent, IndexComponent, FormComponent],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    KubeflowModule,
    ResourceTableModule,
    NamespaceSelectModule,
    ConfirmDialogModule,
    MatRadioModule,
    MatInputModule,
    FormModule,
    KubeflowModule,
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: ImmediateErrorStateMatcher },
  ],
  bootstrap: [AppComponent],
  entryComponents: [FormComponent],
})
export class AppModule {}
