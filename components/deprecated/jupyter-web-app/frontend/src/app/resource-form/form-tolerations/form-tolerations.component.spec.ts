import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormTolerationsComponent } from "./form-tolerations.component";

describe("FormTolerationsComponent", () => {
  let component: FormTolerationsComponent;
  let fixture: ComponentFixture<FormTolerationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormTolerationsComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormTolerationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
