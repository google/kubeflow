import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RokFormConfigurationsComponent } from './rok-form-configurations.component';

describe('RokFormConfigurationsComponent', () => {
  let component: RokFormConfigurationsComponent;
  let fixture: ComponentFixture<RokFormConfigurationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RokFormConfigurationsComponent],
    }).compileComponents();
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
