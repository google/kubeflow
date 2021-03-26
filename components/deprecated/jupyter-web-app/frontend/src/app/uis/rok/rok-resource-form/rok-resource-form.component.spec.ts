import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RokResourceFormComponent } from "./rok-resource-form.component";

describe("RokResourceFormComponent", () => {
  let component: RokResourceFormComponent;
  let fixture: ComponentFixture<RokResourceFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RokResourceFormComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokResourceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
