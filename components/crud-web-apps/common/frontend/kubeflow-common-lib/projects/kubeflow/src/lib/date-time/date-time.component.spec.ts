import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DateTimeComponent } from './date-time.component';
import { ToDatePipe } from './to-date.pipe';
import { DateTimeModule } from './date-time.module';

describe('DateTimeComponent', () => {
  let component: DateTimeComponent;
  let fixture: ComponentFixture<DateTimeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DateTimeModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
