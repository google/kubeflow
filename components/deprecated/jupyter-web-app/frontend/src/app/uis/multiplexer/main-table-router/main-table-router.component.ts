import { Component, OnInit } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-main-table-router",
  templateUrl: "./main-table-router.component.html",
  styleUrls: ["./main-table-router.component.scss"]
})
export class MainTableRouterComponent implements OnInit {
  env = environment;

  constructor() {}

  ngOnInit() {}
}
