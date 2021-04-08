import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetailsListItemComponent } from './details-list-item.component';
import { SnackBarService } from '../../snack-bar/snack-bar.service';
import { MockSnackBarService } from '../../snack-bar/snack-bar.service.spec';
import { DetailsListModule } from '../details-list.module';

describe('DetailsListItemComponent', () => {
  let component: DetailsListItemComponent;
  let fixture: ComponentFixture<DetailsListItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DetailsListModule],
      providers: [
        DetailsListItemComponent,
        { provide: SnackBarService, useClass: MockSnackBarService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
