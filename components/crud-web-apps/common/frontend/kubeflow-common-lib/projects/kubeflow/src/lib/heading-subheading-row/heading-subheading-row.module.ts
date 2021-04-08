import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeadingSubheadingRowComponent } from './heading-subheading-row.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [HeadingSubheadingRowComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [HeadingSubheadingRowComponent],
})
export class HeadingSubheadingRowModule {}
