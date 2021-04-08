import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubmitBarComponent } from './submit-bar.component';
import { FormModule } from '../form.module';

describe('SubmitBarComponent', () => {
  let component: SubmitBarComponent;
  let fixture: ComponentFixture<SubmitBarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
