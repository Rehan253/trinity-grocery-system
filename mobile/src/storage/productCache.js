import AsyncStorage from "@react-native-async-storage/async-storage";
 
const PRODUCT_CACHE_PREFIX = "product_barcode_cache:";
const CACHE_TTL_MS = 15 * 60 * 1000;
 
const getCacheKey = (barcode) =>
  `${PRODUCT_CACHE_PREFIX}${String(barcode || "").trim()}`;
 
const isFreshCache = (cachedAt) => {
  if (!Number.isFinite(cachedAt)) return false;
  return Date.now() - cachedAt < CACHE_TTL_MS;
};
 
export const getCachedProductByBarcode = async (barcode) => {
  const normalized = String(barcode || "").trim();
  if (!normalized) return null;
 
  const key = getCacheKey(normalized);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
 
  try {
    const parsed = JSON.parse(raw);
    const cachedAt = Number(parsed?.cachedAt);
    const product = parsed?.product;
 
    if (!product || !isFreshCache(cachedAt)) {
      await AsyncStorage.removeItem(key);
      return null;
    }
 
    return product;
  } catch (_error) {
    await AsyncStorage.removeItem(key);
    return null;
  }
};
 
export const setCachedProductByBarcode = async (barcode, product) => {
  const normalized = String(barcode || "").trim();
  if (!normalized || !product) return;
 
  const key = getCacheKey(normalized);
  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      cachedAt: Date.now(),
      product,
    })
  );
};