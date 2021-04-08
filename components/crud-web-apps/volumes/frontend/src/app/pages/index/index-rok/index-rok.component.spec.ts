import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IndexRokComponent } from './index-rok.component';

describe('IndexRokComponent', () => {
  let component: IndexRokComponent;
  let fixture: ComponentFixture<IndexRokComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [IndexRokComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexRokComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
