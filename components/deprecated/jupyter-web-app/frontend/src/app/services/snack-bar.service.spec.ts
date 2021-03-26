import { TestBed } from "@angular/core/testing";

import { SnackBarService } from "./snack-bar.service";

describe("SnackBarService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: SnackBarService = TestBed.get(SnackBarService);
    expect(service).toBeTruthy();
  });
});
