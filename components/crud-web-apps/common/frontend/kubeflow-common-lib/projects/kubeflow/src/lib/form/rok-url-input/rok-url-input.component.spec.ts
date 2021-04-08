import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RokUrlInputComponent } from './rok-url-input.component';
import { FormControl } from '@angular/forms';
import { FormModule } from '../form.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('RokUrlInputComponent', () => {
  let component: RokUrlInputComponent;
  let fixture: ComponentFixture<RokUrlInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormModule, BrowserAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokUrlInputComponent);
    component = fixture.componentInstance;
    component.control = new FormControl();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
