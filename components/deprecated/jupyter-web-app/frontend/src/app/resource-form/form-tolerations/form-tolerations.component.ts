import { Component, OnInit, Input } from "@angular/core";
import { TolerationGroup } from "src/app/utils/types";
import { FormGroup } from "@angular/forms";

@Component({
  selector: 'app-form-tolerations',
  templateUrl: './form-tolerations.component.html',
  styleUrls: ['./form-tolerations.component.scss', '../resource-form.component.scss'],
})
export class FormTolerationsComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() tolerationGroups: TolerationGroup[];

  constructor() {}

  ngOnInit() {}
}
