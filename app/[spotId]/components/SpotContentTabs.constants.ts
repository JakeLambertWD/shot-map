export type ContentTabId =
  "showcase" | "creator" | "editing" | "bts" | "educational" | "technique" | "pov" | "shoot-day";

export type ContentTabConfig = {
  id: ContentTabId;
  label: string;
  orderBadge?: string;
  type: string;
  title: string;
  summary: string;
  description: string[];
  captureOnDay: string[];
  structure?: { label: string; text: string }[];
  options?: string[];
  tips?: string[];
};

// The chips under the spot name. Reels holds the Educational, 1 Clip and BTS ideas together.
export type SpotTabId = "showcase" | "creator" | "reels" | "pov";

export const SPOT_TABS = [
  { id: "showcase", label: "Showcase" },
  { id: "creator", label: "Creator Shots" },
  { id: "reels", label: "Reels" },
  { id: "pov", label: "Trial Reels" },
] as const satisfies readonly { id: SpotTabId; label: string }[];

// Guide copy for each content format, used by the Shoot Day guide.
export const CONTENT_TABS = [
  {
    id: "showcase",
    label: "Showcase",
    orderBadge: "Post #1",
    type: "Anchor Carousel",
    title: "Showcase carousel",
    summary: "Your hero set of 6–8 finished frames.",
    description: [
      "Your hero set of 6–8 finished frames that represents the location at its best.",
      "Goes out first, as the anchor post for this spot.",
    ],
    captureOnDay: ["The hero compositions, each empty, with a figure, and with a train."],
  },
  {
    id: "creator",
    label: "Creator Shots",
    type: "Cover Shot",
    title: "Creator shots",
    summary: "You or your camera in frame, with a bold title over the top.",
    description: [
      "A cover-style shot with you, your phone or your camera in the frame, e.g. a mirror selfie or a top-down shot of the camera in hand.",
      "Leave space at the top for a big title like the lens, phone or location.",
    ],
    captureOnDay: ["A creator shot with you or your camera in frame and space above for a title."],
  },
  {
    id: "educational",
    label: "Educational",
    orderBadge: "Post #5",
    type: "Tips Reel",
    title: "Educational reel",
    summary: "A tips video with text on screen or a voiceover.",
    description: [
      "Builds authority and saves by sharing practical advice for shooting this environment (e.g. '3 tips for shooting tube platforms').",
      "Uses footage of the space, your camera settings, and where you stand, paired with your finished photos.",
    ],
    structure: [
      {
        label: "Hook",
        text: "Title hook on screen (e.g. '3 tips for shooting tube platforms') or spoken voiceover.",
      },
      {
        label: "Body & Setting",
        text: "Show the environment, where to position yourself, and the exact focal length/shutter speed.",
      },
      {
        label: "Proof",
        text: "Cut to the resulting finished photograph illustrating each tip.",
      },
    ],
    captureOnDay: [
      "Detailed footage of the space, where you stand, and camera settings/dials (part of the 15–20 min video pass).",
    ],
  },
  {
    id: "technique",
    label: "1 Clip",
    orderBadge: "Post #2",
    type: "Recurring Series",
    title: "1 Clip reel",
    summary:
      "One side-on clip showing the trick, then a hard cut to the photo when you press the shutter.",
    description: [
      "One side-on clip that clearly shows the trick, then a hard cut to the photo the split-second you press the shutter.",
      "The trick is named on screen, like '1 Clip #01: the puddle'.",
      "The scene looks ordinary in the clip, the photo is the surprise, and it loops seamlessly.",
    ],
    options: [
      "A puddle reflection for symmetry and neon reflections.",
      "Low-angle leading lines along tiles, tracks, or platform edges.",
      "Railings, pillars, or archways used as a natural frame.",
    ],
    captureOnDay: ["2–3 takes of the 1 clip shot, filmed side-on and low."],
  },
  {
    id: "pov",
    label: "Trial Reels",
    orderBadge: "Any time",
    type: "Short Series (3–4)",
    title: "Trial Reels",
    summary:
      "Short 5–15s first-person trial reels to test with non-followers without cluttering your grid.",
    description: [
      "Shot from your eyes: walking onto the platform, spotting the frame, raising the camera, the back screen, then a cut to the photo.",
      "Short (5–15 seconds), with a strong text hook in the first second (e.g. 'POV: you wait 20 mins for one train').",
      "Make 3–4 versions with different spots, hooks, or audio, and post them as Trial Reels to test with non-followers.",
      "Share the best performer with your followers. Use the rest to learn which hooks work.",
      "Trial Reels don't appear on your followers' feeds, so they can go out any time without cluttering your grid.",
    ],
    tips: [
      "Hook in second 1: Strong relatable text overlay ('POV: you wait 20 mins for one train').",
      "Pacing: Keep total duration between 5 and 15 seconds.",
      "Distribution: Post as Instagram Trial Reels to reach non-followers first.",
    ],
    captureOnDay: [
      "Trial reel clips filmed with phone held at eye level next to your camera, or on a chest mount.",
      "Get one walk-in, one setup, and one shutter moment at each hero spot.",
    ],
  },
  {
    id: "editing",
    label: "Editing",
    orderBadge: "Post #4",
    type: "Process Carousel",
    title: "Editing carousel",
    summary:
      "A held-back shot with the biggest transformation from RAW to final, not the showcase hero.",
    description: [
      "Spotlights your editing workflow and preset value.",
      "Uses a held-back shot with the biggest transformation from RAW to final, not the showcase hero.",
    ],
    structure: [
      {
        label: "Cover slide",
        text: "You on location in moody light, either holding the camera or with the laptop on a platform bench, plus your reusable text template.",
      },
      {
        label: "Slide 2",
        text: "A desk shot with the edit open in Lightroom.",
      },
      {
        label: "Slides 3+",
        text: "The RAW image, followed by the key edit steps, then the final graded photograph.",
      },
      {
        label: "Last slide",
        text: "A clear preset call to action (link in bio / DM for preset).",
      },
    ],
    captureOnDay: [
      "1–2 held-back compositions specifically for the editing carousel.",
      "The cover portrait, with plenty of negative space above your head for text overlay.",
    ],
  },
  {
    id: "bts",
    label: "BTS",
    orderBadge: "Post #3",
    type: "Long Reel",
    title: "BTS (long reel)",
    summary: "The 'how I got these' follow-up to the showcase.",
    description: [
      "The storytelling follow-up to the anchor showcase post.",
      "Gives viewers the atmosphere and journey behind getting the hero shots.",
    ],
    structure: [
      {
        label: "The Journey",
        text: "You setting up, waiting for the train, observing the space.",
      },
      {
        label: "In Action",
        text: "The camera's back screen as you compose, dial settings, and shoot.",
      },
      {
        label: "The Climax",
        text: "A matched phone-to-final reveal transition that lands on the finished frame.",
      },
    ],
    captureOnDay: [
      "A 15–20 minute phone video pass covering wide ambient shots, waiting moments, and screen-view shooting.",
    ],
  },
  {
    id: "shoot-day",
    label: "Shoot Day",
    orderBadge: "Master Plan",
    type: "Checklist & Schedule",
    title: "What to capture on the day & posting order",
    summary: "Complete shooting checklist and 3–4 week release schedule.",
    description: [
      "Make sure you leave the location with every asset needed to feed all 6 content formats.",
      "Follow the 3–4 week posting order, mixed in with other locations.",
    ],
    captureOnDay: [
      "The hero compositions, each empty, with a figure, and with a train.",
      "1–2 held-back compositions for the editing carousel.",
      "The cover portrait, with space above your head for text.",
      "A creator shot with you or your camera in frame and space above for a title.",
      "A 15–20 minute phone video pass for the BTS and educational reels.",
      "2–3 takes of the 1 clip shot, filmed side-on and low.",
      "Trial reel clips filmed with the phone held at eye level next to your camera, or on a chest mount (one walk-in, one setup, and one shutter moment at each hero spot).",
    ],
  },
] as const;

export const POSTING_SCHEDULE = [
  {
    step: 1,
    title: "Showcase carousel",
    timing: "Week 1",
    role: "Anchor post",
    note: "Your hero set of 6–8 finished frames that introduces the location.",
  },
  {
    step: 2,
    title: "1 Clip reel",
    timing: "Week 1–2",
    role: "Recurring series",
    note: "One-clip side-on reveal with loop ('1 Clip #01'). High shareability.",
  },
  {
    step: 3,
    title: "BTS reel",
    timing: "Week 2",
    role: "Storytelling",
    note: "'How I got these' follow-up to the showcase with phone-to-final transition.",
  },
  {
    step: 4,
    title: "Editing carousel",
    timing: "Week 3",
    role: "Process & Product",
    note: "Held-back shot with biggest transformation from RAW to final + preset CTA.",
  },
  {
    step: 5,
    title: "Educational reel",
    timing: "Week 3–4",
    role: "Authority & Saves",
    note: "'3 tips' breakdown with footage of the space, settings, and standing spot.",
  },
] as const;
