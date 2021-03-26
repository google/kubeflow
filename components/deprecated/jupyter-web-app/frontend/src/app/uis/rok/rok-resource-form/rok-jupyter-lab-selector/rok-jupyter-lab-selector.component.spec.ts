import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RokJupyterLabSelectorComponent } from './rok-jupyter-lab-selector.component';

describe('RokJupyterLabSelectorComponent', () => {
  let component: RokJupyterLabSelectorComponent;
  let fixture: ComponentFixture<RokJupyterLabSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RokJupyterLabSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RokJupyterLabSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
