import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NamespaceSelectComponent } from './namespace-select.component';
import {
  MOCK_NAMESPACES,
  MockBackendService,
} from '../services/backend/backend.service.spec';
import { BackendService } from '../services/backend/backend.service';
import { NamespaceSelectModule } from './namespace-select.module';

describe('NamespaceSelectComponent', () => {
  let component: NamespaceSelectComponent;
  let fixture: ComponentFixture<NamespaceSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NamespaceSelectModule],
      providers: [{ provide: BackendService, useClass: MockBackendService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespaceSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
