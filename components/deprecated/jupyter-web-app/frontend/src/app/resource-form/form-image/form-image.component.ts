import { Component, OnInit, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

@Component({
  selector: "app-form-image",
  templateUrl: "./form-image.component.html",
  styleUrls: ["./form-image.component.scss", "../resource-form.component.scss"]
})
export class FormImageComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() images: string[];
  @Input() readonly: boolean;

  constructor() {}

  ngOnInit() {}
}
