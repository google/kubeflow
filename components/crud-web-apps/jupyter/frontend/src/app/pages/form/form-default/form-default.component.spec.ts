import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDefaultComponent } from './form-default.component';

describe('FormDefaultComponent', () => {
  let component: FormDefaultComponent;
  let fixture: ComponentFixture<FormDefaultComponent>;

  beforeEach(async(() => {
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
