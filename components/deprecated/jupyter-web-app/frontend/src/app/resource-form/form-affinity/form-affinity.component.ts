import { Component, OnInit, Input } from "@angular/core";
import { AffinityConfig } from "src/app/utils/types";
import { FormGroup } from "@angular/forms";

@Component({
  selector: 'app-form-affinity',
  templateUrl: './form-affinity.component.html',
  styleUrls: ['./form-affinity.component.scss', '../resource-form.component.scss'],
})
export class FormAffinityComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() affinityConfigs: AffinityConfig[];

  constructor() {}

  ngOnInit() {}
}
