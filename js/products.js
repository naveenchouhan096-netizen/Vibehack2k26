// Product data + small helpers (plain script, exposes globals)
const PRODUCTS = [
  { id: "shoe",     name: "Left-handed Right Shoe",    emoji: "👟", price: 1499, rating: 2.1, claim: "Only 1 left! of 9,999",  bg: "bg-rad" },
  { id: "stairs",   name: "Stairs (Single)",           emoji: "🪜", price: 899,  rating: 1.4, claim: "Only 1 step left!",      bg: "bg-yel" },
  { id: "silence",  name: "Bottled Silence",           emoji: "🍾", price: 349,  rating: 4.8, claim: "Selling quietly",        bg: "bg-cya" },
  { id: "air",      name: "Premium Air (Used)",        emoji: "💨", price: 199,  rating: 3.2, claim: "Breathed only twice",    bg: "bg-mag" },
  { id: "mug",      name: "Invisible Mug",             emoji: "☕", price: 599,  rating: 0.5, claim: "Can't find stock",       bg: "bg-ora" },
  { id: "usbz",     name: "USB-Z Cable",               emoji: "🔌", price: 449,  rating: 1.9, claim: "Fits nothing, ever",     bg: "bg-rad" },
  { id: "umbrella", name: "Umbrella with Roof Option", emoji: "☂️", price: 2999, rating: 3.7, claim: "Only 2 left! of 40,000", bg: "bg-yel" },
  { id: "wifi",     name: "Pre-owned Wi-Fi",           emoji: "📶", price: 999,  rating: 2.6, claim: "1 bar remaining",        bg: "bg-cya" },
  { id: "pen",      name: "Gently Haunted Pen",        emoji: "🖊️", price: 666,  rating: 4.4, claim: "Writes by itself",       bg: "bg-mag" },
  { id: "tuesday",  name: "Subscription to Tuesday",   emoji: "📅", price: 52,   rating: 1.1, claim: "Renews weekly, forever", bg: "bg-ora" },
  { id: "wheel",    name: "Square Wheel",              emoji: "⬛", price: 1250, rating: 0.9, claim: "Rolls 0% of the time",   bg: "bg-rad" },
  { id: "jar",      name: "Jar of Nothing",            emoji: "🫙", price: 10,   rating: 5,   claim: "Sold out of nothing",    bg: "bg-yel" },
];

// Checkout "overprice": the price in the list is bigger than the price on the product page.
// pct = markup on that item, why = the (made-up) reason shown next to it.
const OVERPRICE = {
  shoe:     { pct: 40,  why: "Left-handed surcharge (it's a right shoe)" },
  stairs:   { pct: 35,  why: "Step tax (you only get one step)" },
  silence:  { pct: 60,  why: "Noise-cancellation fee" },
  air:      { pct: 50,  why: "Air miles charge (breathed twice)" },
  mug:      { pct: 45,  why: "Visibility fee for an invisible mug" },
  usbz:     { pct: 30,  why: "Adapter fee for an adapter that adapts nothing" },
  umbrella: { pct: 75,  why: "Roof Option upgrade (roof sold separately)" },
  wifi:     { pct: 55,  why: "Signal-bar rental" },
  pen:      { pct: 66,  why: "Ghostwriting fee" },
  tuesday:  { pct: 100, why: "Weekly renewal fee (forever)" },
  wheel:    { pct: 50,  why: "Corner maintenance fee" },
  jar:      { pct: 90,  why: "Nothing-handling fee" },
};
// Extra charges added at checkout: flat amount in rupees, or pct of the marked-up items.
const CHECKOUT_FEES = [
  { name: "Delivery to Nowhere",      flat: 149 },
  { name: "Packaging of nothing",     flat: 99 },
  { name: "Convenience fee (for us)", flat: 49 },
  { name: "Regret tax",               pct: 18 },
];

const inr = (n) => "₹" + n.toLocaleString("en-IN");

function toRoman(n) {
  if (n <= 0) return "N";
  const map = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}
