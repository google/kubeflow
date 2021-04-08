import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormRokComponent } from './form-rok.component';

describe('FormRokComponent', () => {
  let component: FormRokComponent;
  let fixture: ComponentFixture<FormRokComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormRokComponent ]
    })
    .compileComponents();
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
