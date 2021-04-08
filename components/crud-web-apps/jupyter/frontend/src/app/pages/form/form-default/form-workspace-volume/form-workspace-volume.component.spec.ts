import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormWorkspaceVolumeComponent } from "./form-workspace-volume.component";

describe("FormWorkspaceVolumeComponent", () => {
  let component: FormWorkspaceVolumeComponent;
  let fixture: ComponentFixture<FormWorkspaceVolumeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormWorkspaceVolumeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormWorkspaceVolumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
