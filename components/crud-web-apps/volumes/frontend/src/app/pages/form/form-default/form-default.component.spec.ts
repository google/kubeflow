import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormDefaultComponent } from './form-default.component';

describe('FormDefaultComponent', () => {
  let component: FormDefaultComponent;
  let fixture: ComponentFixture<FormDefaultComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormDefaultComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
