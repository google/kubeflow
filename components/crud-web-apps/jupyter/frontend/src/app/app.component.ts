import { Component } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    const currentLanguage = this.translate.getBrowserLang();
    const lang = currentLanguage.match(/en|fr/) ? currentLanguage : "en";
    translate.setDefaultLang(lang);
  }
  title = 'frontend';
}
