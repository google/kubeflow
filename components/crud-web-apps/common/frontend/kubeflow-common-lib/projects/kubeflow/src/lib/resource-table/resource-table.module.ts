import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceTableComponent } from './resource-table.component';
import {
  MatTableModule,
  MatDividerModule,
  MatCardModule,
  MatButtonModule,
  MatMenuModule,
  MatIconModule,
} from '@angular/material';
import { StatusComponent } from './status/status.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActionComponent } from './action/action.component';
import { MatChipsModule } from '@angular/material/chips';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActionButtonComponent } from './action-button/action-button.component';
import { IconModule } from '../icon/icon.module';
import { TableComponent } from './table/table.component';
import { DateTimeModule } from '../date-time/date-time.module';
import { PopoverModule } from '../popover/popover.module';
import { TableChipsListComponent } from './chips-list/chips-list.component';
import { ComponentValueComponent } from './component-value/component-value.component';
import { PortalModule } from '@angular/cdk/portal';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    PortalModule,
    FontAwesomeModule,
    MatIconModule,
    IconModule,
    DateTimeModule,
    PopoverModule,
    TranslateModule.forChild(),
  ],
  declarations: [
    ResourceTableComponent,
    StatusComponent,
    ActionComponent,
    ActionButtonComponent,
    TableChipsListComponent,
    TableComponent,
    ComponentValueComponent,
  ],
  exports: [ResourceTableComponent],
})
export class ResourceTableModule {}
