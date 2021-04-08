import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TitleActionsToolbarComponent } from './title-actions-toolbar.component';
import { TitleActionsToolbarModule } from './title-actions-toolbar.module';

describe('TitleActionsToolbarComponent', () => {
  let component: TitleActionsToolbarComponent;
  let fixture: ComponentFixture<TitleActionsToolbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TitleActionsToolbarModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleActionsToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
