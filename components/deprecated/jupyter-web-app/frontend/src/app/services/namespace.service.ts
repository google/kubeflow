import { Injectable } from "@angular/core";
import { ReplaySubject, Subscription, fromEvent } from "rxjs";

declare global {
  interface Window {
    centraldashboard: any;
  }
}

@Injectable()
export class NamespaceService {
  // Observable string sources
  private selectedNamespaceSource = new ReplaySubject<string>(1);

  // Observable string streams
  selectedNamespace$ = this.selectedNamespaceSource.asObservable();

  constructor() {
    fromEvent(window, "DOMContentLoaded").subscribe(_ => {
      if (
        window.centraldashboard &&
        window.centraldashboard.CentralDashboardEventHandler
      ) {
        // Init method will invoke the callback with the event handler instance
        // and a boolean indicating whether the page is iframed or not
        window.centraldashboard.CentralDashboardEventHandler.init(
          (cdeh, isIframed) => {
            // Binds a callback that gets invoked anytime the Dashboard's
            // namespace is changed
            cdeh.onNamespaceSelected = this.updateSelectedNamespace.bind(this);
          }
        );
      } else {
        this.updateSelectedNamespace("kubeflow");
      }
    });
  }

  // GETers
  getSelectedNamespace() {
    return this.selectedNamespace$;
  }

  // Service message commands
  updateSelectedNamespace(namespace: string) {
    if (namespace.length !== 0) {
      this.selectedNamespaceSource.next(namespace);
    }
  }

  dashboardConnected() {
    return (
      window.parent.location.pathname !== window.location.pathname &&
      window.centraldashboard
    );
  }
}
