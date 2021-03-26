import { Component, OnInit, Input } from "@angular/core";
import { RokToken } from "src/app/uis/rok/utils/types";

@Component({
  selector: "app-rok-error-msg",
  templateUrl: "./rok-error-msg.component.html",
  styleUrls: ["./rok-error-msg.component.scss"]
})
export class RokErrorMsgComponent implements OnInit {
  @Input() token: RokToken;

  constructor() {}

  ngOnInit() {}
}
