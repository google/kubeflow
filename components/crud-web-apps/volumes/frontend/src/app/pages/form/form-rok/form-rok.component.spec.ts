import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRokComponent } from './form-rok.component';

describe('FormRokComponent', () => {
  let component: FormRokComponent;
  let fixture: ComponentFixture<FormRokComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormRokComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRokComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
