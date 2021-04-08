import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NameNamespaceInputsComponent } from './name-namespace-inputs.component';
import { NameInputComponent } from './name-input/name-input.component';
import { FormControl } from '@angular/forms';
import { FormModule } from '../form.module';

describe('NameNamespaceInputsComponent', () => {
  let component: NameNamespaceInputsComponent;
  let fixture: ComponentFixture<NameNamespaceInputsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormModule, BrowserAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NameNamespaceInputsComponent);
    component = fixture.componentInstance;
    component.nameControl = new FormControl();
    component.namespaceControl = new FormControl();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
