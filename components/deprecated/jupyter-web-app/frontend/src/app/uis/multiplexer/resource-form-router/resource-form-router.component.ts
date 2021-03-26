import { Component, OnInit } from "@angular/core";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-resource-form-router",
  templateUrl: "./resource-form-router.component.html",
  styleUrls: ["./resource-form-router.component.scss"]
})
export class ResourceFormRouterComponent implements OnInit {
  env = environment;

  constructor() {}

  ngOnInit() {}
}
