import { TestBed } from "@angular/core/testing";

import { RokService } from "./rok.service";

describe("RokService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: RokService = TestBed.get(RokService);
    expect(service).toBeTruthy();
  });
});
