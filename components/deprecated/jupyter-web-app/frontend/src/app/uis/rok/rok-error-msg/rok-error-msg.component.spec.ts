import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RokErrorMsgComponent } from './rok-error-msg.component';

describe('RokErrorMsgComponent', () => {
  let component: RokErrorMsgComponent;
  let fixture: ComponentFixture<RokErrorMsgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RokErrorMsgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokErrorMsgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
