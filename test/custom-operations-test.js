const assert = require("assert");
const { default: sift } = require("../lib");

describe("$never operator", () => {
  // Test data
  const testData = [
    {
      _meta: { quantityReturned: 2 },
      articles: [{ returnReason: "ff_defective" }, { returnReason: "ff_wrong_size" }],
    },
    {
      _meta: { quantityReturned: 1 },
      articles: [{ returnReason: "ff_missing_item" }],
    },
    {
      _meta: { quantityReturned: 5 },
      articles: [{ returnReason: "ff_defective" }, { returnReason: "ff_wrong_size" }, { returnReason: "ff_missing_item" }],
    },
  ];

  // Basic functionality tests
  describe("Basic functionality", () => {
    it("should return true when NONE of the array elements match forbidden values", () => {
      const filter = sift({
        "articles.returnReason": { $never: ["ff_missing_item"] },
      });

      const result = testData.filter(filter);
      assert.equal(result.length, 1);
      assert.equal(result[0]._meta.quantityReturned, 2);
    });

    it("should return false when ANY array element matches a forbidden value", () => {
      const filter = sift({
        "articles.returnReason": { $never: ["ff_defective"] },
      });

      const result = testData.filter(filter);
      assert.equal(result.length, 1);
      assert.equal(result[0]._meta.quantityReturned, 1);
    });

    it("should work with multiple forbidden values", () => {
      const filter = sift({
        "articles.returnReason": { $never: ["ff_missing_item", "ff_wrong_size"] },
      });

      const result = testData.filter(filter);
      assert.equal(result.length, 0);
    });
  });

  // Courier logic specific tests
  describe("Courier logic scenarios", () => {
    it("should identify 'No Sendback Required' customers correctly", () => {
      const noSendbackFilter = sift({
        $and: [{ "_meta.quantityReturned": { $lte: 3 } }, { "articles.returnReason": { $never: ["ff_missing_item"] } }],
      });

      const result = testData.filter(noSendbackFilter);
      assert.equal(result.length, 1);
      assert.equal(result[0]._meta.quantityReturned, 2);
    });

    it("should identify 'Standard Print Label' customers correctly", () => {
      const standardFilter = sift({
        $or: [{ "_meta.quantityReturned": { $gt: 3 } }, { "articles.returnReason": { $in: ["ff_missing_item"] } }],
      });

      const result = testData.filter(standardFilter);
      assert.equal(result.length, 2);
      assert.deepEqual(result.map((r) => r._meta.quantityReturned).sort(), [1, 5]);
    });

    it("should ensure courier filters are mutually exclusive", () => {
      const noSendbackFilter = sift({
        $and: [{ "_meta.quantityReturned": { $lte: 3 } }, { "articles.returnReason": { $never: ["ff_missing_item"] } }],
      });

      const standardFilter = sift({
        $or: [{ "_meta.quantityReturned": { $gt: 3 } }, { "articles.returnReason": { $in: ["ff_missing_item"] } }],
      });

      const noSendbackResults = testData.filter(noSendbackFilter);
      const standardResults = testData.filter(standardFilter);

      // Should have all records covered
      assert.equal(noSendbackResults.length + standardResults.length, testData.length);

      // Should have no overlap
      const noSendbackIds = noSendbackResults.map((r) => r._meta.quantityReturned);
      const standardIds = standardResults.map((r) => r._meta.quantityReturned);
      const intersection = noSendbackIds.filter((id) => standardIds.includes(id));
      assert.equal(intersection.length, 0);
    });
  });

  // Direct array value tests (e.g., product tags)
  describe("Direct array value scenarios", () => {
    const arrayTestData = [
      {
        id: 1,
        productTags: ["electronics", "mobile", "smartphone"],
        category: "tech",
      },
      {
        id: 2,
        productTags: ["clothing", "summer", "cotton"],
        category: "fashion",
      },
      {
        id: 3,
        productTags: ["electronics", "laptop", "gaming"],
        category: "tech",
      },
      {
        id: 4,
        productTags: ["books", "fiction", "bestseller"],
        category: "media",
      },
      {
        id: 5,
        productTags: ["electronics", "mobile", "tablet"],
        category: "tech",
      },
    ];

    it("should exclude items when ANY tag matches forbidden values", () => {
      const filter = sift({
        productTags: { $never: ["mobile"] },
      });

      const result = arrayTestData.filter(filter);
      assert.equal(result.length, 3);
      assert.deepEqual(result.map((r) => r.id).sort(), [2, 3, 4]);
    });

    it("should include items when NO tags match forbidden values", () => {
      const filter = sift({
        productTags: { $never: ["vintage", "antique"] },
      });

      const result = arrayTestData.filter(filter);
      assert.equal(result.length, 5); // All items should match
    });

    it("should work with multiple forbidden tags", () => {
      const filter = sift({
        productTags: { $never: ["mobile", "laptop"] },
      });

      const result = arrayTestData.filter(filter);
      assert.equal(result.length, 2);
      assert.deepEqual(result.map((r) => r.id).sort(), [2, 4]);
    });

    it("should be mutually exclusive with $in for array values", () => {
      const neverInFilter = sift({
        productTags: { $never: ["electronics"] },
      });

      const inFilter = sift({
        productTags: { $in: ["electronics"] },
      });

      const neverInResults = arrayTestData.filter(neverInFilter);
      const inResults = arrayTestData.filter(inFilter);

      // Should cover all records
      assert.equal(neverInResults.length + inResults.length, arrayTestData.length);

      // Should have no overlap
      const neverInIds = neverInResults.map((r) => r.id);
      const inIds = inResults.map((r) => r.id);
      const intersection = neverInIds.filter((id) => inIds.includes(id));
      assert.equal(intersection.length, 0);
    });

    it("should handle empty arrays", () => {
      const emptyArrayData = [
        { id: 1, productTags: [] },
        { id: 2, productTags: ["test"] },
      ];

      const filter = sift({
        productTags: { $never: ["test"] },
      });

      const result = emptyArrayData.filter(filter);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 1);
    });

    it("should handle single-element arrays", () => {
      const singleElementData = [
        { id: 1, productTags: ["exclusive"] },
        { id: 2, productTags: ["common"] },
      ];

      const filter = sift({
        productTags: { $never: ["exclusive"] },
      });

      const result = singleElementData.filter(filter);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 2);
    });

    it("should handle complex tag filtering scenarios", () => {
      const complexData = [
        { id: 1, productTags: ["premium", "limited", "exclusive"], price: 500 },
        { id: 2, productTags: ["basic", "everyday", "affordable"], price: 50 },
        { id: 3, productTags: ["premium", "everyday", "popular"], price: 200 },
        { id: 4, productTags: ["limited", "collectible", "rare"], price: 1000 },
      ];

      // Find non-premium products
      const nonPremiumFilter = sift({
        productTags: { $never: ["premium"] },
      });

      const nonPremiumResults = complexData.filter(nonPremiumFilter);
      assert.equal(nonPremiumResults.length, 2);
      assert.deepEqual(nonPremiumResults.map((r) => r.id).sort(), [2, 4]);

      // Find products that are neither limited nor exclusive
      const regularFilter = sift({
        productTags: { $never: ["limited", "exclusive"] },
      });

      const regularResults = complexData.filter(regularFilter);
      assert.equal(regularResults.length, 2);
      assert.deepEqual(regularResults.map((r) => r.id).sort(), [2, 3]);
    });

    it("should work with combined array and object property filters", () => {
      const combinedFilter = sift({
        $and: [{ productTags: { $never: ["mobile"] } }, { category: "tech" }],
      });

      const result = arrayTestData.filter(combinedFilter);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 3); // Only the laptop item
    });

    it("should demonstrate $never vs $nin behavior with arrays", () => {
      // Test data with different array structures
      const comparisonData = [
        { id: 1, tags: ["a", "b"] }, // No forbidden tags
        { id: 2, tags: ["c", "d"] }, // No forbidden tags
        { id: 3, tags: ["a", "forbidden"] }, // Has forbidden tag
        { id: 4, tags: ["forbidden"] }, // Only forbidden tag
      ];

      const neverInFilter = sift({
        tags: { $never: ["forbidden"] },
      });

      const ninFilter = sift({
        tags: { $nin: ["forbidden"] },
      });

      const neverInResults = comparisonData.filter(neverInFilter);
      const ninResults = comparisonData.filter(ninFilter);

      // Both should exclude items with "forbidden" tag
      assert.equal(neverInResults.length, 2);
      assert.equal(ninResults.length, 2);
      assert.deepEqual(neverInResults.map((r) => r.id).sort(), [1, 2]);
      assert.deepEqual(ninResults.map((r) => r.id).sort(), [1, 2]);

      // They should produce identical results for this case
      assert.deepEqual(
        neverInResults.map((r) => r.id),
        ninResults.map((r) => r.id)
      );
    });

    it("should handle edge case with all tags forbidden", () => {
      const filter = sift({
        productTags: { $never: ["electronics", "clothing", "books"] },
      });

      const result = arrayTestData.filter(filter);
      assert.equal(result.length, 0); // No items should match
    });

    it("should work with numeric arrays", () => {
      const numericData = [
        { id: 1, sizes: [8, 9, 10] },
        { id: 2, sizes: [10, 11, 12] },
        { id: 3, sizes: [6, 7, 8] },
        { id: 4, sizes: [12, 13, 14] },
      ];

      const filter = sift({
        sizes: { $never: [10] },
      });

      const result = numericData.filter(filter);
      assert.equal(result.length, 2);
      assert.deepEqual(result.map((r) => r.id).sort(), [3, 4]);
    });

    it("should work with mixed type arrays", () => {
      const mixedData = [
        { id: 1, values: ["text", 123, true] },
        { id: 2, values: [456, "other", false] },
        { id: 3, values: [123, "text"] },
        { id: 4, values: ["different", 789] },
      ];

      const filter = sift({
        values: { $never: [123] },
      });

      const result = mixedData.filter(filter);
      assert.equal(result.length, 2);
      assert.deepEqual(result.map((r) => r.id).sort(), [2, 4]);
    });
  });

  // Edge cases
  describe("Edge cases", () => {
    it("should handle empty arrays", () => {
      const emptyData = [{ articles: [] }];
      const filter = sift({
        "articles.returnReason": { $never: ["ff_missing_item"] },
      });

      const result = emptyData.filter(filter);
      assert.equal(result.length, 1);
    });

    it("should handle missing arrays", () => {
      const missingData = [{ _meta: { quantityReturned: 1 } }];
      const filter = sift({
        "articles.returnReason": { $never: ["ff_missing_item"] },
      });

      const result = missingData.filter(filter);
      assert.equal(result.length, 1);
    });

    it("should handle single values (non-arrays)", () => {
      const singleValueData = [{ returnReason: "ff_defective" }];
      const filter = sift({
        returnReason: { $never: ["ff_missing_item"] },
      });

      const result = singleValueData.filter(filter);
      assert.equal(result.length, 1);
    });

    it("should handle empty forbidden values array", () => {
      const filter = sift({
        "articles.returnReason": { $never: [] },
      });

      const result = testData.filter(filter);
      assert.equal(result.length, testData.length);
    });
  });

  // Logical complement tests
  describe("Logical complement behavior", () => {
    it("should be the exact opposite of $in", () => {
      const inFilter = sift({
        "articles.returnReason": { $in: ["ff_missing_item"] },
      });

      const neverInFilter = sift({
        "articles.returnReason": { $never: ["ff_missing_item"] },
      });

      const inResults = testData.filter(inFilter);
      const neverInResults = testData.filter(neverInFilter);

      // Should cover all records
      assert.equal(inResults.length + neverInResults.length, testData.length);

      // Should have no overlap
      const inIds = inResults.map((r) => r._meta.quantityReturned);
      const neverInIds = neverInResults.map((r) => r._meta.quantityReturned);
      const intersection = inIds.filter((id) => neverInIds.includes(id));
      assert.equal(intersection.length, 0);
    });

    it("should work with complex multi-value complement", () => {
      const values = ["ff_defective", "ff_wrong_size"];

      const inFilter = sift({
        "articles.returnReason": { $in: values },
      });

      const neverInFilter = sift({
        "articles.returnReason": { $never: values },
      });

      const inResults = testData.filter(inFilter);
      const neverInResults = testData.filter(neverInFilter);

      // Should cover all records
      assert.equal(inResults.length + neverInResults.length, testData.length);

      // Should have no overlap
      const inIds = inResults.map((r) => r._meta.quantityReturned);
      const neverInIds = neverInResults.map((r) => r._meta.quantityReturned);
      const intersection = inIds.filter((id) => neverInIds.includes(id));
      assert.equal(intersection.length, 0);
    });
  });

  // Complete courier filter integration tests
  describe("Complete courier filter integration", () => {
    it("should handle the complete courier filtering scenario", () => {
      const courierData = [
        // No Sendback Required: ≤3 items, no missing items
        {
          _meta: { quantityReturned: 2 },
          articles: [{ returnReason: "ff_defective" }, { returnReason: "ff_wrong_size" }],
        },
        // Standard Print Label: >3 items
        {
          _meta: { quantityReturned: 5 },
          articles: [{ returnReason: "ff_defective" }],
        },
        // Standard Print Label: has missing items
        {
          _meta: { quantityReturned: 2 },
          articles: [{ returnReason: "ff_missing_item" }],
        },
      ];

      const noSendbackFilter = sift({
        $and: [{ "_meta.quantityReturned": { $lte: 3 } }, { "articles.returnReason": { $never: ["ff_missing_item"] } }],
      });

      const standardFilter = sift({
        $or: [{ "_meta.quantityReturned": { $gt: 3 } }, { "articles.returnReason": { $in: ["ff_missing_item"] } }],
      });

      const noSendbackResults = courierData.filter(noSendbackFilter);
      const standardResults = courierData.filter(standardFilter);

      // Verify correct classification
      assert.equal(noSendbackResults.length, 1);
      assert.equal(noSendbackResults[0]._meta.quantityReturned, 2);
      assert.equal(noSendbackResults[0].articles[0].returnReason, "ff_defective");

      assert.equal(standardResults.length, 2);
      const standardQuantities = standardResults.map((r) => r._meta.quantityReturned).sort();
      assert.deepEqual(standardQuantities, [2, 5]);
    });

    it("should demonstrate $never vs $not + $in equivalence", () => {
      // Using $never (simple)
      const neverInFilter = sift({
        $and: [{ "_meta.quantityReturned": { $lte: 3 } }, { "articles.returnReason": { $never: ["ff_missing_item"] } }],
      });

      // Using $not + $in (complex)
      const notInFilter = sift({
        $and: [{ "_meta.quantityReturned": { $lte: 3 } }, { "articles.returnReason": { $not: { $in: ["ff_missing_item"] } } }],
      });

      const neverInResults = testData.filter(neverInFilter);
      const notInResults = testData.filter(notInFilter);

      // Should produce identical results
      assert.equal(neverInResults.length, notInResults.length);
      assert.deepEqual(neverInResults.map((r) => r._meta.quantityReturned).sort(), notInResults.map((r) => r._meta.quantityReturned).sort());
    });

    it("should handle real-world courier data patterns", () => {
      const realWorldData = [
        {
          _meta: { quantityReturned: 1 },
          articles: [{ returnReason: "ff_defective" }],
        },
        {
          _meta: { quantityReturned: 3 },
          articles: [{ returnReason: "ff_defective" }, { returnReason: "ff_wrong_size" }, { returnReason: "ff_missing_item" }],
        },
        {
          _meta: { quantityReturned: 6 },
          articles: [{ returnReason: "ff_defective" }, { returnReason: "ff_defective" }, { returnReason: "ff_wrong_size" }],
        },
      ];

      const noSendbackCount = realWorldData.filter(
        sift({
          $and: [{ "_meta.quantityReturned": { $lte: 3 } }, { "articles.returnReason": { $never: ["ff_missing_item"] } }],
        })
      ).length;

      const standardCount = realWorldData.filter(
        sift({
          $or: [{ "_meta.quantityReturned": { $gt: 3 } }, { "articles.returnReason": { $in: ["ff_missing_item"] } }],
        })
      ).length;

      assert.equal(noSendbackCount, 1);
      assert.equal(standardCount, 2);
      assert.equal(noSendbackCount + standardCount, realWorldData.length);
    });
  });
});
