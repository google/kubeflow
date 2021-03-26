import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MainTableRouterComponent } from "./main-table-router.component";

describe("MainTableRouterComponent", () => {
  let component: MainTableRouterComponent;
  let fixture: ComponentFixture<MainTableRouterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MainTableRouterComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainTableRouterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
