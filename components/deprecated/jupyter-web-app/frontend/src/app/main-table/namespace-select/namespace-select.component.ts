import { Component, OnInit, OnDestroy } from "@angular/core";
import { first } from "rxjs/operators";
import { NamespaceService } from "src/app/services/namespace.service";
import { KubernetesService } from "src/app/services/kubernetes.service";
import { ExponentialBackoff } from "src/app/utils/polling";
import { Subscription } from "rxjs";

@Component({
  selector: "app-namespace-select",
  templateUrl: "./namespace-select.component.html",
  styleUrls: ["./namespace-select.component.scss"]
})
export class NamespaceSelectComponent implements OnInit, OnDestroy {
  namespaces = [];
  currNamespace: string;
  private poller: ExponentialBackoff;
  private subscriptions = new Subscription();

  constructor(
    private namespaceService: NamespaceService,
    private k8s: KubernetesService
  ) {
    this.poller = new ExponentialBackoff();
  }

  ngOnInit() {
    // Keep track of the selected namespace
    this.namespaceService.getSelectedNamespace().subscribe(namespace => {
      this.currNamespace = namespace;
    });

    // Poll untill you get existing Namespaces
    const nsSub = this.poller.start().subscribe(() => {
      this.k8s.getNamespaces().subscribe(namespaces => {
        this.namespaces = namespaces;

        if (
          this.currNamespace === undefined ||
          this.currNamespace.length === 0
        ) {
          return;
        }

        // stop polling
        this.namespaceService.updateSelectedNamespace(this.currNamespace);
        this.poller.stop();
        this.subscriptions.unsubscribe();
      });
    });

    this.subscriptions.add(nsSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  namespaceChanged(namespace: string) {
    this.namespaceService.updateSelectedNamespace(namespace);
  }
}
