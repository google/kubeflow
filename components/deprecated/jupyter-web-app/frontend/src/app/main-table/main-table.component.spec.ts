import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MainTableComponent } from "./main-table.component";

describe("MainTableComponent", () => {
  let component: MainTableComponent;
  let fixture: ComponentFixture<MainTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MainTableComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
