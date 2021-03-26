import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { NamespaceSelectComponent } from "./namespace-select.component";

describe("NamespaceSelectComponent", () => {
  let component: NamespaceSelectComponent;
  let fixture: ComponentFixture<NamespaceSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NamespaceSelectComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespaceSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
