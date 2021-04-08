import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableChipsListComponent } from './chips-list.component';
import { ChipsListValue } from '../types';
import { ChipDescriptor } from '../../details-list/types';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

interface TestRow {
  chips: ChipDescriptor[];
}

describe('TableChipsListComponent', () => {
  let component: TableChipsListComponent;
  let fixture: ComponentFixture<TableChipsListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableChipsListComponent],
      imports: [MatTooltipModule, MatChipsModule, CommonModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableChipsListComponent);
    component = fixture.componentInstance;

    // these chips will be in a field in a row element
    component.element = {
      chips: [
        {
          value: 'chip1: some-value-1',
        },
        {
          value: 'chip2: some-value-2',
        },
      ] as ChipDescriptor[],
    };

    component.valueDescriptor = new ChipsListValue({
      field: 'chips',
      noValueText: 'No items',
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should only render the max number of chips', () => {
    const MAX_CHIPS = 1;
    component.valueDescriptor.maxVisibleChips = MAX_CHIPS;

    fixture.detectChanges();

    const el = fixture.debugElement;
    expect(el.queryAll(By.css('.mat-chip')).length).toEqual(MAX_CHIPS);
  });

  it('should use the valueFn', () => {
    // construct by hand the expected output
    let expectedChips = JSON.parse(
      JSON.stringify(component.element.chips),
    ) as ChipDescriptor[];

    expectedChips = expectedChips.map(chip => {
      chip.value += '-tested';
      return chip;
    });

    component.valueDescriptor.valueFn = (row: TestRow) => {
      row.chips.forEach(chip => (chip.value += '-tested'));
      return row.chips;
    };

    expect(component.getChips(component.element)).toEqual(expectedChips);
  });
});
