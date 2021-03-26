import { TestBed } from "@angular/core/testing";

import { NamespaceService } from "./namespace.service";

describe("NamespaceService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: NamespaceService = TestBed.get(NamespaceService);
    expect(service).toBeTruthy();
  });
});
