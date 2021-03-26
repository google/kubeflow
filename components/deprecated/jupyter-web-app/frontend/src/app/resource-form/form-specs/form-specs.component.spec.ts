import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormSpecsComponent } from "./form-specs.component";

describe("FormSpecsComponent", () => {
  let component: FormSpecsComponent;
  let fixture: ComponentFixture<FormSpecsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormSpecsComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormSpecsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
