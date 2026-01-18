/**
 * Check if a product matches user dietary preferences
 * @param {Object} product - Product object
 * @param {Object} preferences - User preferences object
 * @returns {boolean} - True if product matches preferences
 */
export const matchesUserPreferences = (product, preferences) => {
    if (!preferences) return true

    // Check dietary preferences
    if (preferences.halalOnly && !product.dietaryTags?.includes("halal")) {
        return false
    }
    if (preferences.vegetarian && !product.dietaryTags?.includes("vegetarian")) {
        return false
    }
    if (preferences.vegan && !product.dietaryTags?.includes("vegan")) {
        return false
    }
    if (preferences.kosher && !product.dietaryTags?.includes("kosher")) {
        return false
    }

    // Check allergies - exclude products containing allergens
    if (preferences.allergies && preferences.allergies.length > 0) {
        const productIngredients = (product.ingredients || []).map((ing) => ing.toLowerCase())
        const allergenKeywords = preferences.allergies.map((a) => a.toLowerCase())

        // Check if any allergen is in product ingredients
        for (const allergen of allergenKeywords) {
            // Direct match
            if (productIngredients.some((ing) => ing.includes(allergen) || allergen.includes(ing))) {
                return false
            }

            // Common allergen mappings
            const allergenMap = {
                nuts: ["almond", "walnut", "cashew", "pistachio", "hazelnut", "pecan", "macadamia", "brazil nut"],
                peanuts: ["peanut", "groundnut"],
                dairy: ["milk", "cheese", "butter", "cream", "yogurt", "whey", "casein"],
                eggs: ["egg", "albumin", "lecithin"],
                soy: ["soy", "soya", "tofu", "tempeh"],
                wheat: ["wheat", "flour", "gluten"],
                gluten: ["wheat", "barley", "rye", "flour", "gluten"],
                shellfish: ["shrimp", "crab", "lobster", "prawn", "scallop", "mussel", "oyster"],
                fish: ["fish", "salmon", "tuna", "cod", "sardine", "anchovy"],
                sesame: ["sesame", "tahini"],
                sulfites: ["sulfite", "sulphite"],
                lactose: ["lactose", "milk", "dairy"]
            }

            const mappedAllergens = allergenMap[allergen] || []
            if (
                mappedAllergens.some((mapped) =>
                    productIngredients.some((ing) => ing.includes(mapped) || mapped.includes(ing))
                )
            ) {
                return false
            }
        }
    }

    return true
}

/**
 * Filter products based on user preferences
 * @param {Array} products - Array of product objects
 * @param {Object} preferences - User preferences object
 * @returns {Array} - Filtered products
 */
export const filterProductsByPreferences = (products, preferences) => {
    if (!preferences || Object.keys(preferences).length === 0) {
        return products
    }

    return products.filter((product) => matchesUserPreferences(product, preferences))
}
