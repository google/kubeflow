import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormAffinityComponent } from "./form-affinity.component";

describe("FormAffinityComponent", () => {
  let component: FormAffinityComponent;
  let fixture: ComponentFixture<FormAffinityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormAffinityComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormAffinityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
