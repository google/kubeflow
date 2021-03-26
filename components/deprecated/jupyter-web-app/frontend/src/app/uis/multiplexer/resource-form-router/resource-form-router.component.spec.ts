import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ResourceFormRouterComponent } from "./resource-form-router.component";

describe("ResourceFormRouterComponent", () => {
  let component: ResourceFormRouterComponent;
  let fixture: ComponentFixture<ResourceFormRouterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResourceFormRouterComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceFormRouterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
