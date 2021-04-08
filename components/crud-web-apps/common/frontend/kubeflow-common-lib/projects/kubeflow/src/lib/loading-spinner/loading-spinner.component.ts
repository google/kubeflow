import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';

@Component({
  selector: 'lib-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
})
export class LoadingSpinnerComponent implements AfterViewInit {
  @Input() diameter = 32;
  @ViewChild('spinnerWrapper')
  wrapper: ElementRef;

  public height = `${this.diameter}px`;
  public initialized = false;

  ngAfterViewInit() {
    if (!this.wrapper) {
      return;
    }

    setTimeout(() => {
      const offset = this.wrapper.nativeElement.getBoundingClientRect().top;
      this.height = `calc(100vh - ${offset}px)`;

      this.initialized = true;
    });
  }
}
