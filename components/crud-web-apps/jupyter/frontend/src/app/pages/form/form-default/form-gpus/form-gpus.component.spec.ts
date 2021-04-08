import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormGpusComponent } from './form-gpus.component';

describe('FormGpusComponent', () => {
  let component: FormGpusComponent;
  let fixture: ComponentFixture<FormGpusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormGpusComponent ]
    })
    .compileComponents();
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
