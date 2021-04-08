import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PositiveNumberInputComponent } from './positive-number-input.component';
import { FormControl } from '@angular/forms';
import { FormModule } from '../form.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PositiveNumberInputComponent', () => {
  let component: PositiveNumberInputComponent;
  let fixture: ComponentFixture<PositiveNumberInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormModule, BrowserAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PositiveNumberInputComponent);
    component = fixture.componentInstance;
    component.sizeControl = new FormControl();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
