import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RokMainTableComponent } from "./rok-main-table.component";

describe("RokMainTableComponent", () => {
  let component: RokMainTableComponent;
  let fixture: ComponentFixture<RokMainTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RokMainTableComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokMainTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
