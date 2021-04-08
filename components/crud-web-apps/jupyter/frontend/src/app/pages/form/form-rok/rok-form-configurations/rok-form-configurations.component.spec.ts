import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RokFormConfigurationsComponent } from './rok-form-configurations.component';

describe('RokFormConfigurationsComponent', () => {
  let component: RokFormConfigurationsComponent;
  let fixture: ComponentFixture<RokFormConfigurationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RokFormConfigurationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokFormConfigurationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
