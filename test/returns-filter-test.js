const assert = require("assert");
const { default: sift } = require("../lib");

describe("Returns Portal Filter Tests", () => {
  // Sample return objects with realistic data
  const returnWithDefectiveElectronics = {
    id: "RET-001",
    customerId: "CUST-123",
    tags: ["priority", "damaged"],
    articles: [
      {
        sku: "PHONE-001",
        tags: ["electronics", "fragile", "warranty"],
        returnReason: "damaged_in_shipping",
      },
      {
        sku: "CASE-001",
        tags: ["accessory", "plastic"],
        returnReason: "wrong_color",
      },
      {
        sku: "CHARGER-001",
        tags: ["electronics", "accessory"],
        returnReason: "defective",
      },
    ],
  };

  const returnAllDefectiveElectronics = {
    id: "RET-002",
    customerId: "CUST-456",
    tags: ["standard", "complete"],
    articles: [
      {
        sku: "LAPTOP-001",
        tags: ["electronics", "fragile"],
        returnReason: "defective",
      },
      {
        sku: "MOUSE-001",
        tags: ["electronics", "accessory"],
        returnReason: "defective",
      },
    ],
  };

  const returnClothingItems = {
    id: "RET-003",
    customerId: "CUST-789",
    tags: ["priority", "incomplete"],
    articles: [
      {
        sku: "SHIRT-001",
        tags: ["clothing", "cotton"],
        returnReason: "wrong_size",
      },
      {
        sku: "PANTS-001",
        tags: ["clothing", "denim"],
        returnReason: "wrong_size",
      },
      {
        sku: "SHOES-001",
        tags: ["footwear", "leather"],
        returnReason: "damaged_in_shipping",
      },
      {
        sku: "HAT-001",
        tags: ["clothing", "accessory"],
        returnReason: "changed_mind",
      },
    ],
  };

  const returnWithMissingItem = {
    id: "RET-004",
    customerId: "CUST-999",
    tags: ["standard", "missing_items"],
    articles: [
      {
        sku: "BOOK-001",
        tags: ["media", "paperback"],
        returnReason: "ff_missing_item",
      },
    ],
  };

  describe("Return Reason Filtering - IF/ELSE Scenarios", () => {
    describe("IF: At least one article has 'defective' return reason", () => {
      const filter = sift({ "articles.returnReason": { $in: ["defective"] } });

      it("should match return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), true);
      });

      it("should match return with all defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), true);
      });

      it("should NOT match return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should NOT match return with missing item", () => {
        assert.strictEqual(filter(returnWithMissingItem), false);
      });
    });

    describe("ELSE: None of the articles has 'defective' return reason", () => {
      const filter = sift({ "articles.returnReason": { $never: ["defective"] } });

      it("should NOT match return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), false);
      });

      it("should NOT match return with all defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), false);
      });

      it("should match return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), true);
      });

      it("should match return with missing item", () => {
        assert.strictEqual(filter(returnWithMissingItem), true);
      });
    });

    describe("IF: At least one article does NOT have 'defective' return reason", () => {
      const filter = sift({ "articles.returnReason": { $nin: ["defective"] } });

      it("should match return with mixed reasons (some defective, some not)", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), true);
      });

      it("should NOT match return where all articles are defective", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), false);
      });

      it("should match return with clothing items (no defective)", () => {
        assert.strictEqual(filter(returnClothingItems), true);
      });

      it("should match return with missing item (no defective)", () => {
        assert.strictEqual(filter(returnWithMissingItem), true);
      });
    });

    describe("ELSE: All articles have 'defective' return reason", () => {
      const filter = sift({ "articles.returnReason": { $always: "defective" } });

      it("should NOT match return with mixed reasons", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), false);
      });

      it("should match return where all articles are defective", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), true);
      });

      it("should NOT match return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should NOT match return with missing item", () => {
        assert.strictEqual(filter(returnWithMissingItem), false);
      });
    });
  });

  describe("Article Tags Filtering - IF/ELSE Scenarios", () => {
    describe("IF: At least one article has 'electronics' tag", () => {
      const filter = sift({ "articles.tags": { $in: ["electronics"] } });

      it("should match return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), true);
      });

      it("should match return with all defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), true);
      });

      it("should NOT match return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should NOT match return with missing book", () => {
        assert.strictEqual(filter(returnWithMissingItem), false);
      });
    });

    describe("ELSE: None of the articles has 'electronics' tag", () => {
      const filter = sift({ "articles.tags": { $never: ["electronics"] } });

      it("should NOT match return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), false);
      });

      it("should NOT match return with all defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), false);
      });

      it("should match return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), true);
      });

      it("should match return with missing book", () => {
        assert.strictEqual(filter(returnWithMissingItem), true);
      });
    });

    describe("IF: At least one article has both 'electronics' AND 'fragile' tags", () => {
      const filter = sift({ "articles.tags": { $all: ["electronics", "fragile"] } });

      it("should match return with fragile electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), true);
      });

      it("should match return with all fragile electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), true);
      });

      it("should NOT match return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should NOT match return with missing book", () => {
        assert.strictEqual(filter(returnWithMissingItem), false);
      });
    });
  });

  describe("Return-Level Tags Filtering", () => {
    describe("IF: Return has 'priority' tag", () => {
      const filter = sift({ tags: { $in: ["priority"] } });

      it("should match priority return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), true);
      });

      it("should NOT match standard return with defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), false);
      });

      it("should match priority return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), true);
      });

      it("should NOT match standard return with missing item", () => {
        assert.strictEqual(filter(returnWithMissingItem), false);
      });
    });

    describe("ELSE: Return does NOT have 'priority' tag", () => {
      const filter = sift({ tags: { $never: ["priority"] } });

      it("should NOT match priority return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), false);
      });

      it("should match standard return with defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), true);
      });

      it("should NOT match priority return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should match standard return with missing item", () => {
        assert.strictEqual(filter(returnWithMissingItem), true);
      });
    });
  });

  describe("Combined Article and Return Filtering", () => {
    describe("Priority returns with defective electronics", () => {
      const filter = sift({
        $and: [{ tags: { $in: ["priority"] } }, { "articles.tags": { $in: ["electronics"] } }, { "articles.returnReason": { $in: ["defective"] } }],
      });

      it("should match priority return with defective electronics", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), true);
      });

      it("should NOT match standard return with defective electronics", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), false);
      });

      it("should NOT match priority return with clothing items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should NOT match standard return with missing item", () => {
        assert.strictEqual(filter(returnWithMissingItem), false);
      });
    });

    describe("Standard returns with NO damaged items", () => {
      const filter = sift({
        $and: [{ tags: { $in: ["standard"] } }, { "articles.returnReason": { $never: ["damaged_in_shipping"] } }],
      });

      it("should NOT match priority return with damaged items", () => {
        assert.strictEqual(filter(returnWithDefectiveElectronics), false);
      });

      it("should match standard return with no damaged items", () => {
        assert.strictEqual(filter(returnAllDefectiveElectronics), true);
      });

      it("should NOT match priority return with damaged items", () => {
        assert.strictEqual(filter(returnClothingItems), false);
      });

      it("should match standard return with missing item (no damaged)", () => {
        assert.strictEqual(filter(returnWithMissingItem), true);
      });
    });

    describe("Courier Logic: Returns requiring standard print label", () => {
      const requiresStandardLabel = (returnObj) => {
        return returnObj.articles.length > 3 || returnObj.articles.some((article) => article.returnReason === "ff_missing_item");
      };

      it("should NOT require standard label for return with 3 items and no missing", () => {
        assert.strictEqual(requiresStandardLabel(returnWithDefectiveElectronics), false);
      });

      it("should NOT require standard label for return with 2 items and no missing", () => {
        assert.strictEqual(requiresStandardLabel(returnAllDefectiveElectronics), false);
      });

      it("should require standard label for return with 4 items", () => {
        assert.strictEqual(requiresStandardLabel(returnClothingItems), true);
      });

      it("should require standard label for return with missing item", () => {
        assert.strictEqual(requiresStandardLabel(returnWithMissingItem), true);
      });
    });

    describe("Courier Logic: Returns with no sendback required", () => {
      const noSendbackRequired = (returnObj) => {
        return returnObj.articles.length <= 3 && !returnObj.articles.some((article) => article.returnReason === "ff_missing_item");
      };

      it("should have no sendback required for return with 3 items and no missing", () => {
        assert.strictEqual(noSendbackRequired(returnWithDefectiveElectronics), true);
      });

      it("should have no sendback required for return with 2 items and no missing", () => {
        assert.strictEqual(noSendbackRequired(returnAllDefectiveElectronics), true);
      });

      it("should require sendback for return with 4 items", () => {
        assert.strictEqual(noSendbackRequired(returnClothingItems), false);
      });

      it("should require sendback for return with missing item", () => {
        assert.strictEqual(noSendbackRequired(returnWithMissingItem), false);
      });
    });
  });

  describe("Edge Cases and Validation", () => {
    describe("Empty articles array handling", () => {
      const emptyReturn = {
        id: "RET-EMPTY",
        tags: ["test"],
        articles: [],
      };

      it("should NOT match filter for defective items when articles is empty", () => {
        const filter = sift({ "articles.returnReason": { $in: ["defective"] } });
        assert.strictEqual(filter(emptyReturn), false);
      });

      it("should match filter for no defective items when articles is empty", () => {
        const filter = sift({ "articles.returnReason": { $never: ["defective"] } });
        assert.strictEqual(filter(emptyReturn), true);
      });
    });

    describe("Single article return filtering", () => {
      it("should correctly identify single article return", () => {
        const filter = (returnObj) => returnObj.articles.length === 1;

        assert.strictEqual(filter(returnWithDefectiveElectronics), false);
        assert.strictEqual(filter(returnAllDefectiveElectronics), false);
        assert.strictEqual(filter(returnClothingItems), false);
        assert.strictEqual(filter(returnWithMissingItem), true);
      });
    });

    describe("Complex filter combinations", () => {
      it("should correctly apply complex AND conditions", () => {
        // Priority returns with electronics, but not all defective, and no changed mind
        const complexFilter = sift({
          $and: [
            { tags: { $in: ["priority"] } }, // Return is priority
            { "articles.tags": { $in: ["electronics"] } }, // Has electronics
            { "articles.returnReason": { $nin: ["defective"] } }, // At least one non-defective
            { "articles.returnReason": { $never: ["changed_mind"] } }, // No changed mind
          ],
        });

        assert.strictEqual(complexFilter(returnWithDefectiveElectronics), true);
        assert.strictEqual(complexFilter(returnAllDefectiveElectronics), false);
        assert.strictEqual(complexFilter(returnClothingItems), false);
        assert.strictEqual(complexFilter(returnWithMissingItem), false);
      });
    });
  });
});
