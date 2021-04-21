import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '@app/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

@Component({
  selector: 'app-form-image',
  templateUrl: './form-image.component.html',
  styleUrls: ['./form-image.component.scss'],
})
export class FormImageComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() images: string[];
  @Input() imagesGroupOne: string[];
  @Input() imagesGroupTwo: string[];
  @Input() allowCustomImage: boolean;

  subs = new Subscription();

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
      'jupyterlab',
      sanitizer.bypassSecurityTrustResourceUrl(environment.jupyterlabLogo),
    );
    iconRegistry.addSvgIcon(
      'group-one',
      sanitizer.bypassSecurityTrustResourceUrl(environment.groupOneLogo),
    );
    iconRegistry.addSvgIcon(
      'group-two',
      sanitizer.bypassSecurityTrustResourceUrl(environment.groupTwoLogo),
    );
  }

  ngOnInit() {
    this.subs.add(
      this.parentForm.get('customImageCheck').valueChanges.subscribe(check => {
        // Make sure that the use will insert and Image value
        if (check) {
          this.parentForm.get('customImage').setValidators(Validators.required);
          this.parentForm.get('image').setValidators([]);
          this.parentForm.get('imageGroupOne').setValidators([]);
          this.parentForm.get('imageGroupTwo').setValidators([]);
        }
        this.parentForm.get('serverType').valueChanges.subscribe(selection => {
          if (selection === 'jupyter') {
            this.parentForm.get('customImage').setValidators([]);
            this.parentForm.get('image').setValidators(Validators.required);
            this.parentForm.get('imageGroupOne').setValidators([]);
            this.parentForm.get('imageGroupTwo').setValidators([]);
          } else if (selection === 'group-one') {
            this.parentForm.get('customImage').setValidators([]);
            this.parentForm.get('image').setValidators([]);
            this.parentForm
              .get('imageGroupOne')
              .setValidators(Validators.required);
            this.parentForm.get('imageGroupTwo').setValidators([]);
          } else if (selection === 'group-two') {
            this.parentForm.get('customImage').setValidators([]);
            this.parentForm.get('image').setValidators([]);
            this.parentForm.get('imageGroupOne').setValidators([]);
            this.parentForm
              .get('imageGroupTwo')
              .setValidators(Validators.required);
          }
          this.parentForm.get('image').updateValueAndValidity();
          this.parentForm.get('imageGroupOne').updateValueAndValidity();
          this.parentForm.get('imageGroupTwo').updateValueAndValidity();
        });
        this.parentForm.get('customImage').updateValueAndValidity();
        this.parentForm.get('serverType').updateValueAndValidity();
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
