// Camera moves and angles to capture as b-roll at a spot.
export const B_ROLL_SHOTS = [
  { name: "Reveal", description: "Start blocked by something, move to uncover the subject" },
  { name: "Over the shoulder", description: "From behind you, seeing what you see" },
  { name: "Walk in", description: "Camera locked off on a tripod, you walk into the empty frame" },
  { name: "Push in", description: "Move slowly towards the subject" },
  { name: "Pull out", description: "Start tight and move back to show the whole scene" },
  { name: "Tilt up", description: "Start on the ground, tilt up to the scene" },
  { name: "Tilt down", description: "Start on the sky or a building top, tilt down to you" },
  {
    name: "Pedestal up",
    description: "Raise the camera straight up, like rising over a wall or railing",
  },
  { name: "Top down", description: "Camera directly above, looking straight down" },
  { name: "Low angle", description: "Camera on the ground looking up" },
  { name: "Orbit", description: "Circle around the subject" },
  { name: "Slider", description: "Slide sideways past the subject" },
  {
    name: "Parallax",
    description: "Slide past something close in the foreground so the background shifts",
  },
  { name: "POV", description: "From your own eye line" },
  { name: "Follow", description: "Walk behind someone as they move" },
  { name: "Lead", description: "Walk backwards in front of someone as they walk towards you" },
  { name: "Rack focus", description: "Switch focus from something near to something far" },
  {
    name: "Zoom in / zoom out",
    description: "Twist the zoom ring while the camera stays still",
  },
  { name: "Crash zoom", description: "A very fast zoom in, for punchy, dramatic moments" },
  {
    name: "Punch in",
    description:
    "A zoom done in the edit by cropping into 4K footage, smoother than zooming by hand",
  },
  {
    name: "Dolly zoom",
    description:
    "Walk backwards while zooming in (or forwards while zooming out), so the subject stays the same size but the background stretches or squashes. It’s the famous “Vertigo” effect",
  },
  {
    name: "Pass by",
    description: "Subject walks past the camera, close enough to fill the frame briefly",
  },
  { name: "Whip pan", description: "Fast pan that blurs, used to cut to the next shot" },
] as const satisfies readonly { name: string; description: string }[];
