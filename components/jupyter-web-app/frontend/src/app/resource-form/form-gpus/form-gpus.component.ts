import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GPUVendor } from 'src/app/utils/types';

@Component({
  selector: 'app-form-gpus',
  templateUrl: './form-gpus.component.html',
  styleUrls: ['./form-gpus.component.scss', '../resource-form.component.scss'],
})
export class FormGpusComponent implements OnInit {
  private subscriptions = new Subscription();
  private gpuCtrl: FormGroup;

  @Input() parentForm: FormGroup;
  @Input() vendors: GPUVendor[];
  @Input() nums: string[];

  // -----------------------------
  // ----- Custom Validation -----
  // -----------------------------
  public getVendorError() {
    const vendorCtrl = this.parentForm.get('gpus').get('vendor');

    if (vendorCtrl.hasError('vendorNullName')) {
      return `You must also specify the GPU Vendor for the assigned GPUs`;
    }
  }

  private vendorWithNum(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const num = this.parentForm.get('gpus').get('num').value;
      const vendor = this.parentForm.get('gpus').get('vendor').value;

      // if the user has specified a number of GPUs,
      // they must also specify the GPU vendor
      if (num !== 'none' && vendor === '') {
        return {vendorNullName: true};
      } else {
        return null;
      }
    };
  }

  // -------------------------------
  // ----- Component Functions -----
  // -------------------------------
  constructor() {
  }

  ngOnInit() {
    this.gpuCtrl = this.parentForm.get('gpus') as FormGroup;

    // Vendor should not be empty if the user selects GPUs num
    this.parentForm
      .get('gpus')
      .get('vendor')
      .setValidators([this.vendorWithNum()]);

    this.subscriptions.add(
      this.gpuCtrl.get('num').valueChanges.subscribe((n: string) => {
        if (n === 'none') {
          this.gpuCtrl.get('vendor').disable();
        } else {
          this.gpuCtrl.get('vendor').enable();
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
