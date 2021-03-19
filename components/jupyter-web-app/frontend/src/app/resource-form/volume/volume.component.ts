import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Volume } from 'src/app/utils/types';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-volume',
  templateUrl: './volume.component.html',
  styleUrls: ['./volume.component.scss'],
})
export class VolumeComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private _notebookName: string;

  existingPvcMap: Map<string, Volume> = new Map();
  existingPvcNames: Array<string>;
  nameIsFocused: boolean;

  // -----------------------------
  // ----- @Input Parameters -----
  // -----------------------------
  @Input() volumeForm: FormGroup;
  @Input() namespace: string;
  @Input() defaultStorageClass: boolean;

  @Input()
  get notebookName() {
    return this._notebookName;
  }

  set notebookName(s: string) {
    this._notebookName = s;
    // if the user changes the notebook name, reset the volume form to default
    this.resetForm()
  }

  @Input()
  set pvcs(vl: Volume[]) {
    // store the Volumes in a Map() so we can easily look them up by name
    this.existingPvcMap.clear();
    vl.map(v => {
        this.existingPvcMap.set(v.name, v);
      }
    );

    // update the array of PVC names (used for dropdown selector)
    this.existingPvcNames = Array.from(this.existingPvcMap.keys()).sort()
    this.refreshForm()
  }

  // ----------------------------------
  // ----- 'New' Volume Functions -----
  // ----------------------------------
  selectedVolTypeIsNew(): boolean {
    return this.volumeForm.value.type === "New";
  }

  newTypeIsDisabled(): boolean {
    // the DefaultStorageClass must exist if class is '{none}'
    if (this.volumeForm.value.class === '{none}') {
      return !this.defaultStorageClass;
    } else {
      return false;
    }
  }

  newTypeTooltip(): string {
    // display a warning if 'New' is disabled
    if (this.newTypeIsDisabled()) {
      return `Can't create new PVC: no DefaultStorageClass in cluster`;
    } else {
      return ''
    }
  }

  // -----------------------------
  // ----- Utility Functions -----
  // ------------------------------
  handleChangeType(newType: string): void {
    if (newType === "New") {
      // the volume does not exist, so can be changed
      this.volumeForm.controls.size.enable();
      this.volumeForm.controls.mode.enable();
    } else if (newType === "Existing") {
      // the volume already exists, so cant be changed
      this.volumeForm.controls.size.disable();
      this.volumeForm.controls.mode.disable();
    }
  }

  handleChangeName(newName: string): void {
    // don't interrupt if the user is typing
    if (this.nameIsFocused) return;

    // if the new volume
    let _currentVolumeExists = this.existingPvcMap.has(newName)
    let _currentVolume = this.existingPvcMap.get(newName)
    if (_currentVolumeExists) {
      this.volumeForm.controls.type.setValue("Existing");

      // display volume properties to user
      this.volumeForm.controls.size.setValue(_currentVolume.size)
      this.volumeForm.controls.mode.setValue(_currentVolume.mode)
      this.volumeForm.controls.class.setValue(_currentVolume.class)

    } else {
      this.volumeForm.controls.type.setValue('New');
    }
  }

  resetForm(): void {
    // set all non-name values first
    //  - allows handleChangeName() to overwrite our changes if the volume exists
    this.volumeForm.controls.size.setValue(this.volumeForm.value.defaultSize)
    this.volumeForm.controls.mode.setValue(this.volumeForm.value.defaultMode)
    this.volumeForm.controls.path.setValue(this.volumeForm.value.defaultPath)
    this.volumeForm.controls.class.setValue(this.volumeForm.value.defaultClass)

    let _templateName = this.volumeForm.value.defaultName

    // if the notebook name is "", reset back to the un-templated value
    if (this.notebookName) {
      let _templatedName = _templateName.replace("{notebook-name}", this.notebookName)
      this.volumeForm.controls.name.setValue(_templatedName)
    } else {
      this.volumeForm.controls.name.setValue(_templateName)
    }
  }

  refreshForm(): void {
    this.handleChangeName(this.volumeForm.value.name)
  }

  // -------------------------------
  // ----- Component Functions -----
  // -------------------------------
  constructor() {
  }

  ngOnInit() {
    // changes to name
    this.subscriptions.add(
      this.volumeForm.get('name').valueChanges.subscribe((s: string) => {
        this.handleChangeName(s);
      })
    );

    // changes to type
    this.subscriptions.add(
      this.volumeForm.get('type').valueChanges.subscribe((s: string) => {
        this.handleChangeType(s);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
