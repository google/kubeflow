import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAffinityTolerationsComponent } from './form-affinity-tolerations.component';

describe('FormAffinityTolerationsComponent', () => {
  let component: FormAffinityTolerationsComponent;
  let fixture: ComponentFixture<FormAffinityTolerationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormAffinityTolerationsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormAffinityTolerationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
