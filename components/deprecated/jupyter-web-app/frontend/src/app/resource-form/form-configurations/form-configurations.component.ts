import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { PodDefault } from "src/app/utils/types";
import { NamespaceService } from "src/app/services/namespace.service";
import { Subscription } from "rxjs";
import { KubernetesService } from "src/app/services/kubernetes.service";

@Component({
  selector: "app-form-configurations",
  templateUrl: "./form-configurations.component.html",
  styleUrls: [
    "./form-configurations.component.scss",
    "../resource-form.component.scss"
  ]
})
export class FormConfigurationsComponent implements OnInit {
  podDefaults: PodDefault[];
  subscriptions = new Subscription();

  @Input() parentForm: FormGroup;

  constructor(private ns: NamespaceService, private k8s: KubernetesService) {}

  ngOnInit() {
    // Keep track of the selected namespace
    const nsSub = this.ns.getSelectedNamespace().subscribe(namespace => {
      // Get the PodDefaults of the new Namespace
      this.k8s.getPodDefaults(namespace).subscribe(pds => {
        this.podDefaults = pds;
      });
    });

    this.subscriptions.add(nsSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
