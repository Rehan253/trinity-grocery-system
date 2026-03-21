/**
 * Aligns mobile filters with backend `category` / product name strings
 * (same idea as `Frontend/src/utils/categoryMapping.js`).
 */

const CATEGORY_RULES: { name: string; keywords: string[] }[] = [
  {
    name: "Beverages",
    keywords: [
      "beverage",
      "beverages",
      "drinks",
      "water",
      "juice",
      "soda",
      "cola",
      "coffee",
      "tea",
      "sparkling",
      "beer",
      "wine",
      "smoothie",
    ],
  },
  {
    name: "Dairy",
    keywords: ["dairy", "milk", "cheese", "yogurt", "butter", "cream", "kefir"],
  },
  {
    name: "Seafood",
    keywords: [
      "seafood",
      "fish",
      "shrimp",
      "prawn",
      "crab",
      "lobster",
      "oyster",
      "mussel",
      "scallop",
      "tuna",
      "salmon",
      "sardine",
      "anchovy",
    ],
  },
  {
    name: "Meat",
    keywords: [
      "meat",
      "beef",
      "pork",
      "chicken",
      "turkey",
      "lamb",
      "veal",
      "duck",
      "bacon",
      "ham",
      "sausage",
    ],
  },
  {
    name: "Vegetables",
    keywords: [
      "vegetable",
      "vegetables",
      "legume",
      "legumes",
      "tomato",
      "carrot",
      "onion",
      "potato",
      "spinach",
      "pepper",
      "courgette",
      "zucchini",
      "aubergine",
      "eggplant",
    ],
  },
  {
    name: "Fruits",
    keywords: [
      "fruit",
      "fruits",
      "apple",
      "banana",
      "berry",
      "citrus",
      "orange",
      "grape",
      "pear",
      "peach",
      "mango",
      "pineapple",
      "strawberry",
      "raspberry",
      "blueberry",
    ],
  },
  {
    name: "Bakery",
    keywords: [
      "bakery",
      "bread",
      "biscuit",
      "cake",
      "pastry",
      "croissant",
      "muffin",
      "cookie",
      "brioche",
      "bun",
      "bagel",
    ],
  },
  {
    name: "Snacks",
    keywords: [
      "snack",
      "snacks",
      "chocolate",
      "candy",
      "sweet",
      "bar",
      "chips",
      "crackers",
      "nuts",
      "granola",
      "muesli",
      "popcorn",
    ],
  },
];

function normalizeTokens(value: string): string[] {
  return String(value)
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export type ProductCategoryInput = {
  category?: string | null;
  name?: string | null;
};

/** Canonical shelf category for filtering (Fruits, Vegetables, …, Other). */
export function getCanonicalCategoryName(product: ProductCategoryInput): string {
  const categoryTokens = normalizeTokens(product?.category ?? "");
  for (const rule of CATEGORY_RULES) {
    if (
      categoryTokens.some((token) =>
        rule.keywords.some((keyword) => token.includes(keyword)),
      )
    ) {
      return rule.name;
    }
  }

  const nameTokens = normalizeTokens(product?.name ?? "");
  for (const rule of CATEGORY_RULES) {
    if (
      nameTokens.some((token) =>
        rule.keywords.some((keyword) => token.includes(keyword)),
      )
    ) {
      return rule.name;
    }
  }

  return "Other";
}

/** Maps home tab id → canonical name (tabs without a match only show under "all"). */
export const FILTER_TAB_TO_CANONICAL: Record<string, string> = {
  fruits: "Fruits",
  vegetables: "Vegetables",
  dairy: "Dairy",
  bakery: "Bakery",
  snacks: "Snacks",
};

export function productMatchesCategoryTab(
  selectedTabId: string,
  product: ProductCategoryInput,
): boolean {
  if (selectedTabId === "all") return true;
  const expected = FILTER_TAB_TO_CANONICAL[selectedTabId];
  if (!expected) return true;
  return getCanonicalCategoryName(product) === expected;
}
