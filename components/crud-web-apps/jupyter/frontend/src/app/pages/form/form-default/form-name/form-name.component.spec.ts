import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormNameComponent } from "./form-name.component";

describe("FormNameComponent", () => {
  let component: FormNameComponent;
  let fixture: ComponentFixture<FormNameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormNameComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
