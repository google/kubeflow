import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormConfigurationsComponent } from '../../form-default/form-configurations/form-configurations.component';

@Component({
  selector: 'app-rok-form-configurations',
  templateUrl: './rok-form-configurations.component.html',
  styleUrls: ['./rok-form-configurations.component.scss'],
})
export class RokFormConfigurationsComponent
  extends FormConfigurationsComponent
  implements OnInit, OnDestroy {}
