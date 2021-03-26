import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { FormGroup, Validators } from "@angular/forms";
import { Volume } from "src/app/utils/types";
import { Subscription } from "rxjs";
import { RokService } from "../../services/rok.service";
import { first } from "rxjs/operators";

@Component({
  selector: "app-rok-volume",
  templateUrl: "./rok-volume.component.html",
  styleUrls: ["./rok-volume.component.scss"]
})
export class RokVolumeComponent implements OnInit, OnDestroy {
  private nbName = "";

  newPVC: Volume;
  existingPVCs: Volume[] = [];
  readOnly = false;

  subscriptions = new Subscription();

  // ----- @Input Parameters -----
  @Input() volume: FormGroup;

  @Input()
  get notebookName() {
    return this.nbName;
  }
  set notebookName(nm: string) {
    if (!this.volume.disabled) {
      this.notebookNameChanged(nm);
    }
  }

  @Input()
  set ephemeral(b: boolean) {
    if (!this.volume.disabled) {
      this.storageOptionChanged(b);
    }
  }

  @Input() pvcs: Volume[];
  @Input() namespace: string;
  @Input() storageClasses: string[] = [];
  @Input() token: string;

  // ----- Get macros -----
  get selectedVolIsExistingType(): boolean {
    return this.volume.value.type === "Existing";
  }

  get currentVolName(): string {
    return this.volume
      .get("templatedName")
      .value.replace("{notebook-name}", this.notebookName);
  }

  // ----- utility functions -----
  updateVolType(type): void {
    const rokUrl = this.volume.get("extraFields").get("rokUrl");
    if (type === "Existing") {
      // Enable rokUrl
      rokUrl.enable();
      rokUrl.setValidators([Validators.required]);
    } else {
      rokUrl.setValidators([]);
      rokUrl.disable();
    }
  }

  autofillVolume(pasteEvent: ClipboardEvent = null) {
    let url = "";
    if (pasteEvent) {
      // Get the data from the Paste event if the user used copy/paste
      url = pasteEvent.clipboardData.getData("text");
    } else {
      url = this.volume.value.extraFields["rokUrl"];
    }

    this.rok
      .getVolume(url, this.token)
      .pipe(first())
      .subscribe(vol => {
        this.volume.get("name").setValue(vol.name);
        this.volume.get("size").setValue(vol.size);
        this.volume.get("path").setValue(vol.path);
      });
  }

  // ----- Component Functions -----
  constructor(private rok: RokService) {}

  ngOnInit() {
    // type
    this.subscriptions.add(
      this.volume.get("type").valueChanges.subscribe((type: string) => {
        this.updateVolType(type);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // ----- @Input change handling functions -----
  notebookNameChanged(nm: string): void {
    if (this.volume.disabled) {
      return;
    }

    this.nbName = nm;
    this.volume.controls.name.setValue(this.currentVolName);
  }

  storageOptionChanged(ephemeral: boolean): void {
    if (ephemeral) {
      // Disable all fields
      this.volume.controls.type.disable();
      this.volume.controls.extraFields.get("rokUrl").disable();
      this.volume.controls.name.disable();
      this.volume.controls.size.disable();
      this.volume.controls.mode.disable();
    } else if (!ephemeral && !this.selectedVolIsExistingType) {
      // New
      this.volume.controls.type.enable();
      this.volume.controls.name.enable();
      this.volume.controls.size.enable();
      this.volume.controls.mode.enable();
    } else {
      // Existing
      this.volume.controls.extraFields.get("rokUrl").enable();
    }
  }
}
