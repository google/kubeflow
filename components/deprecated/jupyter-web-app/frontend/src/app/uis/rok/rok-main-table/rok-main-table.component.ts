import { Component, OnInit } from "@angular/core";
import { RokService } from "../services/rok.service";
import { RokToken, EMPTY_TOKEN } from "src/app/uis/rok/utils/types";
import { Subscription, of } from "rxjs";
import { catchError } from "rxjs/operators";

@Component({
  selector: "app-rok-main-table",
  templateUrl: "./rok-main-table.component.html",
  styleUrls: ["./rok-main-table.component.scss"]
})
export class RokMainTableComponent implements OnInit {
  subscriptions: Subscription = new Subscription();
  token: RokToken = EMPTY_TOKEN;

  constructor(private rok: RokService) {}

  ngOnInit() {
    // Load the Rok Token for further API calls
    this.rok
      .getRokSecret("kubeflow")
      .pipe(catchError(_ => of({ name: "rok-token-name", value: "" })))
      .subscribe(token => {
        this.token = token;
      });
  }
}
