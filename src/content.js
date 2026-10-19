// Corrected business number confirmed by the user; optional public build-time override.
export function validatedPhone(value = "") {
  const normalized = value.replace(/[\s()-]/g, "");
  return /^\+91[6-9]\d{9}$/.test(normalized) ? normalized : null;
}
export const phone = validatedPhone(
  import.meta.env?.VITE_CONTACT_PHONE || "+919567495707",
);
export const displayPhone = phone
  ? `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`
  : "";
export const services = [
  {
    number: "01",
    title: "Weddings & celebrations",
    short: "Weddings",
    subtitle: "Your story. Beautifully brought to life.",
    description:
      "From intimate gatherings to grand celebrations, we design and deliver events that reflect your story, style and dreams. Every detail is a little more you.",
    includes: [
      "Destination weddings",
      "Receptions & engagements",
      "Private celebrations",
      "Décor & guest experiences",
    ],
    image: { page: 2, x: 0, y: 956, w: 402, h: 452 },
  },
  {
    number: "02",
    title: "Corporate events",
    short: "Corporate",
    subtitle: "Big ideas deserve an extraordinary stage.",
    description:
      "Bring people, purpose and possibility together. We turn corporate milestones into thoughtfully planned experiences, from the first welcome to the final applause.",
    includes: [
      "Conferences & annual meets",
      "Product launches",
      "Award nights",
      "Team building programs",
    ],
    image: { page: 3, x: 708, y: 895, w: 316, h: 230 },
  },
  {
    number: "03",
    title: "MICE & business travel",
    short: "MICE & travel",
    subtitle: "Meaningful connections. Remarkable destinations.",
    description:
      "Meetings, incentives, conferences and exhibitions, made seamless. We bring the planning, travel and hospitality together so your people can focus on what matters.",
    includes: [
      "Meetings & incentive travel",
      "Conferences & exhibitions",
      "Delegation support",
      "Travel & hospitality management",
    ],
    image: { page: 3, x: 336, y: 897, w: 359, h: 226 },
  },
  {
    number: "04",
    title: "Brand experiences",
    short: "Brand experiences",
    subtitle: "Make an impression that stays.",
    description:
      "Give your brand a life beyond the screen. We create experiences that invite people in, spark conversations and build memorable connections.",
    includes: [
      "Brand activations",
      "Product launches",
      "Mall activities",
      "On-ground campaigns",
    ],
    image: { page: 3, x: 6, y: 892, w: 318, h: 229 },
  },
  {
    number: "05",
    title: "Event production",
    short: "Production",
    subtitle: "Every detail. Every cue. Every moment.",
    description:
      "The craft behind the experience. Creative design and technical precision come together to transform a space into something extraordinary.",
    includes: [
      "Stage & décor",
      "Audio, visuals & lighting",
      "Entertainment & technical support",
      "Set design & fabrication",
    ],
    image: { page: 4, x: 585, y: 227, w: 433, h: 696 },
  },
];

export function whatsappUrl(message, recipient = phone) {
  const valid = validatedPhone(recipient || "");
  return valid
    ? `https://wa.me/${valid.replace("+", "")}?text=${encodeURIComponent(message)}`
    : null;
}
