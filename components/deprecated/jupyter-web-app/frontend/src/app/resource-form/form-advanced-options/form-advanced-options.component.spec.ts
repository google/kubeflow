import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormAdvancedOptionsComponent } from "./form-advanced-options.component";

describe("FormAdvancedOptionsComponent", () => {
  let component: FormAdvancedOptionsComponent;
  let fixture: ComponentFixture<FormAdvancedOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormAdvancedOptionsComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormAdvancedOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
