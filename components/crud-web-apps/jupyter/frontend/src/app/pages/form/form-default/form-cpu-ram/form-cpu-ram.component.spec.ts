import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCpuRamComponent } from './form-cpu-ram.component';

describe('FormCpuRamComponent', () => {
  let component: FormCpuRamComponent;
  let fixture: ComponentFixture<FormCpuRamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormCpuRamComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCpuRamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
