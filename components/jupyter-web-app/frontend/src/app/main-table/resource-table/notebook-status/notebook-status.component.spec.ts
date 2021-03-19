import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { NotebookStatusComponent } from "./notebook-status.component";

describe("NotebookStatusComponent", () => {
  let component: NotebookStatusComponent;
  let fixture: ComponentFixture<NotebookStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NotebookStatusComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotebookStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
