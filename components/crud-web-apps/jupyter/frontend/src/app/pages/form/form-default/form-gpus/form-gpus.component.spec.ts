import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormGpusComponent } from './form-gpus.component';

describe('FormGpusComponent', () => {
  let component: FormGpusComponent;
  let fixture: ComponentFixture<FormGpusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormGpusComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormGpusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
