import { Component, OnInit, ViewChild } from "@angular/core";
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Subscription } from "rxjs";
import { first } from "rxjs/operators";
import { isEqual } from "lodash";

import { NamespaceService } from "src/app/services/namespace.service";
import { KubernetesService } from "src/app/services/kubernetes.service";
import { Resource } from "src/app/utils/types";
import { ExponentialBackoff } from "src/app/utils/polling";
import { ConfirmDialogComponent } from "./confirm-dialog/confirm-dialog.component";

@Component({
  selector: "app-resource-table",
  templateUrl: "./resource-table.component.html",
  styleUrls: ["./resource-table.component.scss"],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
      state('expanded', style({height: '*', visibility: 'visible'})),
      transition('expanded <=> collapsed', animate('350ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ResourceTableComponent implements OnInit {
  private poller: ExponentialBackoff;
  private subscriptions = new Subscription();

  private _resources: Resource[] = [];
  private _currNamespace = "";

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  // ---------------------------
  // ----- Table Functions -----
  // ---------------------------
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = [
    "status",
    "name",
    "age",
    "image",
    "actions",
  ];
  expandedResource: Resource | null;

  resourceEqual(resource1: Resource, resource2: Resource): boolean {
    if (resource1 && resource2) {
      const resource1Id = `${resource1.name}/${resource1.namespace}`
      const resource2Id = `${resource2.name}/${resource2.namespace}`
      return resource1Id === resource2Id
    } else {
      return false
    }

  }

  trackByFn(index: number, r: Resource) {
    return `${r.name}/${r.namespace}`;
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  // -------------------------------------
  // ----- Notebook Action Functions -----
  // -------------------------------------
  connectResource(rsrc: Resource, event: Event): void {
    window.open(`/notebook/${rsrc.namespace}/${rsrc.name}/`);
    event.stopPropagation();
  }

  deleteResource(rsrc: Resource): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: "fit-content",
        data: {
          title: "WARNING: you are about to DELETE a Notebook Server",
          message:
            `Server Name: <b>${rsrc.name}</b><br>` +
            `Data not stored on a PersistentVolume <ins>will be lost</ins>!`,
          no: "cancel",
          yes: "delete",
          yesClass: "red"
        }
      })
    ;

    dialogRef
      .afterClosed()
      .pipe(first())
      .subscribe(result => {
        if (!result || result !== "delete") {
          return;
        }

        this.k8s
          .deleteResource(rsrc.namespace, rsrc.name)
          .pipe(first())
          .subscribe(r => {
            this.poller.reset();
          });
      });
  }

  stopResource(rsrc: Resource): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "fit-content",
      data: {
        title: "WARNING: you are about to STOP a Notebook Server",
        message:
          `Server Name: <b>${rsrc.name}</b><br>` +
          `Data not stored on a PersistentVolume <ins>will be lost</ins>!`,
        no: "cancel",
        yes: "stop",
        yesClass: "orange"
      }
    });

    dialogRef
      .afterClosed()
      .pipe(first())
      .subscribe(result => {
        if (!result || result !== "stop") {
          return;
        }

        this.k8s
          .patchResource(rsrc.namespace, rsrc.name, {
            "metadata": {
              "annotations": {
                "kubeflow-resource-stopped": "true"
              }
            }
          })
          .pipe(first())
          .subscribe(r => {
            this.poller.reset();
          });
      });
  }

  startResource(rsrc: Resource): void {
    this.k8s
      .patchResource(rsrc.namespace, rsrc.name, {
        "metadata": {
          "annotations": {
            "kubeflow-resource-stopped": null
          }
        }
      })
      .pipe(first())
      .subscribe(r => {
        this.poller.reset();
      });
  }

  // -------------------------------
  // ----- Component Functions -----
  // -------------------------------
  constructor(private namespaceService: NamespaceService,
              private k8s: KubernetesService,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.dataSource.sort = this.sort;

    // Create the exponential backoff poller
    this.poller = new ExponentialBackoff({interval: 1000, retries: 3});
    const resourcesSub = this.poller.start().subscribe(() => {
      // NOTE: We are using both the 'trackBy' feature in the Table for performance
      // and also detecting with lodash if the new data is different from the old
      // one. This is because, if the data changes we want to reset the poller
      if (!this._currNamespace) {
        return;
      }

      this.k8s.getResource(this._currNamespace).subscribe(resources => {
        if (!isEqual(this._resources, resources)) {
          this._resources = resources;
          this.dataSource.data = this._resources;
          this.poller.reset();
        }
      });
    });

    // Keep track of the selected namespace
    const namespaceSub = this.namespaceService
      .getSelectedNamespace()
      .subscribe(namespace => {
        this._currNamespace = namespace;
        this.poller.reset();
      });

    this.subscriptions.add(resourcesSub);
    this.subscriptions.add(namespaceSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
