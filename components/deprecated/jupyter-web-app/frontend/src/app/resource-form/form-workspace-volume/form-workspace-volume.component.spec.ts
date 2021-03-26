import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormWorkspaceVolumeComponent } from "./form-workspace-volume.component";

describe("FormWorkspaceVolumeComponent", () => {
  let component: FormWorkspaceVolumeComponent;
  let fixture: ComponentFixture<FormWorkspaceVolumeComponent>;

  beforeEach(async(() => {
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
