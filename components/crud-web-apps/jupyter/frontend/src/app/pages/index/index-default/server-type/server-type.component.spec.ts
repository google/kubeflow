import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerTypeComponent } from './server-type.component';

describe('ServerTypeComponent', () => {
  let component: ServerTypeComponent;
  let fixture: ComponentFixture<ServerTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServerTypeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
