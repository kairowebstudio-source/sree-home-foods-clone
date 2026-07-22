import ashwagandha from "@/assets/p-ashwagandha.jpeg";
import amla from "@/assets/p-amla.jpeg";
import abc from "@/assets/p-abc.jpeg";
import chilli from "@/assets/p-chilli.jpeg";
import honey from "@/assets/p-honey.jpeg";
import junnu from "@/assets/p-junnu.jpeg";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  category: "Powders" | "Spices" | "Honey" | "Traditional";
  weight: string;
  price: number;
  mrp?: number;
  image: string;
  description: string;
  benefits: string[];
};

export const formatPrice = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const products: Product[] = [
  {
    slug: "ashwagandha-powder",
    name: "Ashwagandha Powder",
    tagline: "A nutritional powerhouse",
    category: "Powders",
    weight: "170g",
    price: 349,
    mrp: 449,
    image: ashwagandha,
    description:
      "Stone-ground Ashwagandha root, sun-dried and carefully milled to preserve every bit of its earthy strength. A daily spoonful for calm energy and resilient wellbeing.",
    benefits: ["Calcium", "Iron", "Fibre", "Antioxidants"],
  },
  {
    slug: "amla-powder",
    name: "Amla Powder",
    tagline: "Vitamin C rich superfruit",
    category: "Powders",
    weight: "200g",
    price: 299,
    mrp: 379,
    image: amla,
    description:
      "Freshly harvested Indian gooseberries slow-dried and finely powdered. Bright, tart, and packed with the goodness of amla in every serving.",
    benefits: ["Vitamin C", "Antioxidants", "Fibre", "Calcium"],
  },
  {
    slug: "abc-powder",
    name: "ABC Powder",
    tagline: "Apple + Beetroot + Carrot",
    category: "Powders",
    weight: "200g",
    price: 399,
    mrp: 499,
    image: abc,
    description:
      "A vibrant blend of apple, beetroot and carrot — gently dried to lock in colour and nutrition. Stir into water, milk or smoothies for a natural glow.",
    benefits: ["Natural Blend", "Iron", "Vitamins", "No Additives"],
  },
  {
    slug: "chilli-powder",
    name: "Guntur Chilli Powder",
    tagline: "Highest grade spice from origin",
    category: "Spices",
    weight: "400g",
    price: 279,
    mrp: 349,
    image: chilli,
    description:
      "Sun-ripened Guntur chillies, hand-sorted and stone-ground for a deep colour and fiery, unmistakable Andhra heat. No artificial colours. No fillers.",
    benefits: ["Single Origin", "No Colours", "Deep Aroma", "Stone-ground"],
  },
  {
    slug: "raw-honey",
    name: "Kriveva Raw Honey",
    tagline: "No added sugar. Ever.",
    category: "Honey",
    weight: "1kg",
    price: 749,
    mrp: 999,
    image: honey,
    description:
      "Unheated, unfiltered raw honey collected from wild apiaries. Rich, floral and delightfully unpredictable — the way real honey should be.",
    benefits: ["Raw & Unfiltered", "No Sugar", "No Heat Processing", "Pure"],
  },
  {
    slug: "milk-junnu-powder",
    name: "Kamadhenuvu Milk Junnu Powder",
    tagline: "Traditional Telugu dessert, ready in minutes",
    category: "Traditional",
    weight: "200g",
    price: 329,
    mrp: 399,
    image: junnu,
    description:
      "The much-loved Andhra milk junnu, reimagined as an instant mix. Add milk, steam, and serve — a nostalgic dessert on your table in minutes.",
    benefits: ["ISO 22000 Certified", "Instant", "Traditional Recipe", "Vegetarian"],
  },

];

export const categories = ["All", "Powders", "Spices", "Honey", "Traditional"] as const;
