import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActionComponent } from './action.component';
import { ActionIconValue } from '../types';
import { ResourceTableModule } from '../resource-table.module';

describe('ActionComponent', () => {
  let component: ActionComponent;
  let fixture: ComponentFixture<ActionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ResourceTableModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionComponent);
    component = fixture.componentInstance;
    component.action = new ActionIconValue({
      name: '',
      color: '',
      iconReady: '',
      tooltip: '',
    });
    component.data = {};

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
