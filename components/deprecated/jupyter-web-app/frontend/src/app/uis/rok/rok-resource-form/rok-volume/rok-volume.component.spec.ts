import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RokVolumeComponent } from './rok-volume.component';

describe('RokVolumeComponent', () => {
  let component: RokVolumeComponent;
  let fixture: ComponentFixture<RokVolumeComponent>;

  beforeEach(async(() => {
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
