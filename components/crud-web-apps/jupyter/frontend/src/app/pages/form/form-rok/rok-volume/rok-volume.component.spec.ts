import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RokVolumeComponent } from './rok-volume.component';

describe('RokVolumeComponent', () => {
  let component: RokVolumeComponent;
  let fixture: ComponentFixture<RokVolumeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RokVolumeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokVolumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
