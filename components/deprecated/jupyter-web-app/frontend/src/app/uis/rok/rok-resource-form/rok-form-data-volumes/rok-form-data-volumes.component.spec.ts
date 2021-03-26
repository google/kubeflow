import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RokFormDataVolumesComponent } from './rok-form-data-volumes.component';

describe('RokFormDataVolumesComponent', () => {
  let component: RokFormDataVolumesComponent;
  let fixture: ComponentFixture<RokFormDataVolumesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RokFormDataVolumesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokFormDataVolumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
