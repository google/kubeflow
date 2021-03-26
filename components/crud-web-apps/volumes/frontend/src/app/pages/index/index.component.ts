import { Component, OnInit } from '@angular/core';
import { environment } from '@app/environment';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent {
  env = environment;

  constructor() {}
}
