import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormConfigurationsComponent } from './form-configurations.component';

describe('FormConfigurationsComponent', () => {
  let component: FormConfigurationsComponent;
  let fixture: ComponentFixture<FormConfigurationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormConfigurationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormConfigurationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
