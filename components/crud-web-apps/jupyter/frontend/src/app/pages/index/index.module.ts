import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IndexRokModule } from './index-rok/index-rok.module';
import { IndexDefaultModule } from './index-default/index-default.module';
import { IndexComponent } from './index.component';
import { ServerTypeComponent } from './index-default/server-type/server-type.component';
import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  declarations: [IndexComponent, ServerTypeComponent],
  imports: [CommonModule, IndexRokModule, IndexDefaultModule, MatIconModule, MatTooltipModule],
  entryComponents: [ServerTypeComponent],
})
export class IndexModule {}
