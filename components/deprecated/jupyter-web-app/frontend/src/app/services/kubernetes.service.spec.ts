import { TestBed } from "@angular/core/testing";

import { KubernetesService } from "./kubernetes.service";

describe("KubernetesService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: KubernetesService = TestBed.get(KubernetesService);
    expect(service).toBeTruthy();
  });
});
