import { Component, Input } from "@angular/core";

enum NotebookStatus {
  Unknown,
  Running,
  Stopped,
  Warning,
  Error,
  Waiting,
}

@Component({
  selector: "app-notebook-status",
  templateUrl: "./notebook-status.component.html",
  styleUrls: ["./notebook-status.component.scss"]
})
export class NotebookStatusComponent {
  private _currentStatus = NotebookStatus.Unknown;

  @Input() statusReason: string;

  @Input()
  set statusName(s: string) {
    if (s === 'running') {
      this._currentStatus = NotebookStatus.Running;
    }
    else if (s === 'warning') {
      this._currentStatus = NotebookStatus.Waiting;
    }
    else if (s === 'error') {
      this._currentStatus = NotebookStatus.Error;
    }
    else if (s === 'waiting') {
      this._currentStatus = NotebookStatus.Waiting;
    }
    else if (s === 'stopped') {
      this._currentStatus = NotebookStatus.Stopped;
    }
    else {
      this._currentStatus = NotebookStatus.Unknown;
    }
  }

  statusUnknown(): boolean {
    return this._currentStatus === NotebookStatus.Unknown
  }

  statusRunning(): boolean {
    return this._currentStatus === NotebookStatus.Running
  }

  statusStopped(): boolean {
    return this._currentStatus === NotebookStatus.Stopped
  }

  statusWarning(): boolean {
    return this._currentStatus === NotebookStatus.Warning
  }

  statusError(): boolean {
    return this._currentStatus === NotebookStatus.Error
  }

  statusWaiting(): boolean {
    return this._currentStatus === NotebookStatus.Waiting
  }

  constructor() {
  }
}
