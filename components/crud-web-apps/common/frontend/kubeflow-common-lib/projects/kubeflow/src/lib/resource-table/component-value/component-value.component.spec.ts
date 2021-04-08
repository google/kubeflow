import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  ComponentValueComponent,
  TableColumnComponent,
} from './component-value.component';
import { ResourceTableModule } from '../resource-table.module';
import { Component, NgModule } from '@angular/core';
import { ComponentValue } from '../types';
import { By } from '@angular/platform-browser';

interface MockData {
  message: any;
}

@Component({
  selector: 'lib-dummy-component',
  template: '{{ element }}',
})
class MockComponent implements TableColumnComponent {
  public element: string;
}

@Component({
  selector: 'lib-dummy-dict-component',
  template: '{{ element.message }}',
})
class MockDictComponent implements TableColumnComponent {
  public element: MockData;
}

@NgModule({
  declarations: [MockComponent, MockDictComponent],
  imports: [],
  exports: [MockComponent, MockDictComponent],
})
class MockModule {}

describe('ComponentValueComponent', () => {
  let component: ComponentValueComponent;
  let fixture: ComponentFixture<ComponentValueComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ResourceTableModule, MockModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentValueComponent);
    component = fixture.componentInstance;
    component.element = 'hello friend';

    component.valueDescriptor = new ComponentValue({
      component: MockComponent,
    });

    fixture.detectChanges();
  });

  it('should show the updated row string value', () => {
    const el = fixture.debugElement.query(By.css('lib-dummy-component'));
    expect(el.nativeElement.textContent).toEqual('hello friend');

    // the value of the row gets updated
    component.element = 'hello again friend';
    fixture.detectChanges();

    const updated = fixture.debugElement.query(By.css('lib-dummy-component'));
    expect(updated.nativeElement.textContent).toEqual('hello again friend');
  });

  it('should show the updated row dict value', () => {
    // create a new component from scratch that will use the MockDictComponent
    fixture = TestBed.createComponent(ComponentValueComponent);
    component = fixture.componentInstance;
    component.element = { message: 'hello friend' };

    component.valueDescriptor = new ComponentValue({
      component: MockDictComponent,
    });

    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('lib-dummy-dict-component'));
    expect(el.nativeElement.textContent).toEqual('hello friend');

    // the value of an inner property of the row's value gets updated
    component.element.message = 'hello again friend';
    fixture.detectChanges();

    const updated = fixture.debugElement.query(
      By.css('lib-dummy-dict-component'),
    );
    expect(updated.nativeElement.textContent).toEqual('hello again friend');
  });
});
