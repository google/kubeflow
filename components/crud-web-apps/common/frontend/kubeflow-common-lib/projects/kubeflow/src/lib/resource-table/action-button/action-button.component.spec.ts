import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActionButtonComponent } from './action-button.component';
import { ActionButtonValue } from '../types';
import { ResourceTableModule } from '../resource-table.module';

describe('ActionButtonComponent', () => {
  let component: ActionButtonComponent;
  let fixture: ComponentFixture<ActionButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ResourceTableModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionButtonComponent);
    component = fixture.componentInstance;

    component.data = {};
    component.action = new ActionButtonValue({
      name: '',
      tooltip: '',
      color: '',
      field: 'buttonStatus',
      text: '',
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
