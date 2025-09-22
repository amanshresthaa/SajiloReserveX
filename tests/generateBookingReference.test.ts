import assert from "node:assert/strict";
import test from "node:test";

import { generateBookingReference } from "../server/booking-reference";

const REFERENCE_REGEX = /^[A-Z0-9]{10}$/;

test("generateBookingReference returns 10 character uppercase strings", () => {
  const reference = generateBookingReference();
  assert.equal(reference.length, 10);
  assert.match(reference, REFERENCE_REGEX);
});

test("generateBookingReference produces diverse values", () => {
  const samples = new Set<string>();
  for (let index = 0; index < 1000; index += 1) {
    const reference = generateBookingReference();
    assert.match(reference, REFERENCE_REGEX);
    samples.add(reference);
  }

  // Expect near-unique results; collisions are extremely unlikely for base36^10 space.
  assert.ok(samples.size > 990, "Expected unique references in sample set");
});
