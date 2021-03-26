import { Component, OnInit, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

@Component({
  selector: "app-form-advanced-options",
  templateUrl: "./form-advanced-options.component.html",
  styleUrls: [
    "./form-advanced-options.component.scss",
    "../resource-form.component.scss"
  ]
})
export class FormAdvancedOptionsComponent implements OnInit {
  @Input() parentForm: FormGroup;

  constructor() {}

  ngOnInit() {}
}
