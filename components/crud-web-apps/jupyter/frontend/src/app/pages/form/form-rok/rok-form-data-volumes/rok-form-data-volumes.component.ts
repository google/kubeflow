import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { Volume } from 'src/app/types';
import { addRokDataVolume } from '../utils';

@Component({
  selector: 'app-rok-form-data-volumes',
  templateUrl: './rok-form-data-volumes.component.html',
  styleUrls: ['./rok-form-data-volumes.component.scss'],
})
export class RokFormDataVolumesComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() readonly: boolean;
  @Input() pvcs: Volume[];
  @Input() storageClasses: string[];
  @Input() token: string;

  get datavols() {
    const vols = this.parentForm.get('datavols') as FormArray;
    return vols.controls;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {}

  addVol() {
    addRokDataVolume(this.parentForm);
  }

  deleteVol(idx: number) {
    const vols = this.parentForm.get('datavols') as FormArray;
    vols.removeAt(idx);
    this.parentForm.updateValueAndValidity();
  }
}
