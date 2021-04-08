import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormDataVolumesComponent } from "./form-data-volumes.component";

describe("FormDataVolumesComponent", () => {
  let component: FormDataVolumesComponent;
  let fixture: ComponentFixture<FormDataVolumesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormDataVolumesComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormDataVolumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
