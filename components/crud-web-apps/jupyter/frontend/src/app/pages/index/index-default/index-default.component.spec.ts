import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexDefaultComponent } from './index-default.component';

describe('IndexDefaultComponent', () => {
  let component: IndexDefaultComponent;
  let fixture: ComponentFixture<IndexDefaultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IndexDefaultComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
