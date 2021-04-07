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
  @Input() hideRegistry: boolean;
  @Input() hideTag: boolean;
  @Input() imagesVSCode: string[];
  @Input() imagesRStudio: string[];
  @Input() allowCustomImage: boolean;

  subs = new Subscription();

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon('jupyterlab', sanitizer.bypassSecurityTrustResourceUrl(environment.jupyterlabLogo));
    iconRegistry.addSvgIcon('vs-code', sanitizer.bypassSecurityTrustResourceUrl(environment.vscodeLogo));
    iconRegistry.addSvgIcon('rstudio', sanitizer.bypassSecurityTrustResourceUrl(environment.rstudioLogo));
  }

  ngOnInit() {
    this.subs.add(
      this.parentForm.get('customImageCheck').valueChanges.subscribe(check => {
        // Make sure that the use will insert and Image value
        if (check) {
          this.parentForm.get('customImage').setValidators(Validators.required);
          this.parentForm.get('image').setValidators([]);
          this.parentForm.get('imageVSCode').setValidators([]);
          this.parentForm.get('imageRStudio').setValidators([]);
        }
        this.parentForm.get('serverType').valueChanges.subscribe(selection => {
          if (selection === "jupyter") {
            this.parentForm.get('customImage').setValidators([]);
            this.parentForm.get('image').setValidators(Validators.required);
            this.parentForm.get('imageVSCode').setValidators([]);
            this.parentForm.get('imageRStudio').setValidators([]);
          } else if (selection === "vs-code") {
            this.parentForm.get('customImage').setValidators([]);
            this.parentForm.get('image').setValidators([]);
            this.parentForm.get('imageVSCode').setValidators(Validators.required);
            this.parentForm.get('imageRStudio').setValidators([]);
          } else if (selection === "rstudio") {
            this.parentForm.get('customImage').setValidators([]);
            this.parentForm.get('image').setValidators([]);
            this.parentForm.get('imageVSCode').setValidators([]);
            this.parentForm.get('imageRStudio').setValidators(Validators.required);
          }
          this.parentForm.get('image').updateValueAndValidity();
          this.parentForm.get('imageVSCode').updateValueAndValidity();
          this.parentForm.get('imageRStudio').updateValueAndValidity();
          
        })
        this.parentForm.get('customImage').updateValueAndValidity();
        this.parentForm.get('serverType').updateValueAndValidity();
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  imageDisplayName(image: string): string {
    const [name, tag = null] = image.split(':');
    let tokens = name.split('/')

    if (this.hideRegistry && tokens.length > 1 && tokens[0].includes('.')) {
      tokens.shift();
    }

    let displayName = tokens.join('/');

    if (!this.hideTag && tag !== null) {
      displayName = `${displayName}:${tag}`;
    }

    return displayName;
  }

}
