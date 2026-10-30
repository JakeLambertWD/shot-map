# Photo Spots Map

`/` shows the places I want to photograph as pins on a dark map of London.
Each pin opens `/[spotId]`, a full-screen view with a photo carousel and a
note for each photo.

## Flow

```
Neon DB (photo_spot, photo_spot_image)
            ↓
tRPC spots router (server/routers/spots.ts)
            ↓
/                    → PhotoSpotsMap (MapLibre + Supercluster)
/[spotId]            → SpotDetail (carousel, per-photo notes)
```

## Pieces

1. **db/migrations/002_photo_spots.sql** creates `photo_spot` (location,
   tags) and `photo_spot_image` (image URL, caption, position). Run it manually
   in the Neon SQL editor, like `001`.
2. **db/seeds/002_photo_spots_sample.sql** adds eight `[Sample]` spots around
   London Bridge so the map isn't empty. Delete them with
   `delete from photo_spot where title like '[Sample]%';`
3. **server/routers/spots.ts**
   - `spots.list`: every spot with its first photo (used as the pin) and photo count.
   - `spots.byId`: one spot with all photos in carousel order.
   - `spots.delete`: removes the spot, its photos (cascade) and their files in Vercel Blob.
   - `spots.create` / `spots.updatePhotoCaption` / `spots.delete`: edits. Editing is
     currently open to everyone, including production, because the site has no sign-in.
     Set `CAN_EDIT_SPOTS` in `lib/photo-spots.ts` to `false` to lock it again.
4. **app/components/PhotoSpotsMap.tsx** renders the map with
   `react-map-gl/maplibre`. Pins are grouped with `supercluster`; tapping a
   group zooms in until it splits. It's loaded with `next/dynamic` and
   `ssr: false` because MapLibre needs `window`.
5. **app/[spotId]/components/** holds the spot view: a tab system covering the
   content pieces shot at this location (Showcase carousels, Creator shots, Editing carousel,
   BTS reel, Educational reel, 1 Clip reel, Trial Reels, and
   Shoot Day checklist & posting schedule), with a scroll-snap photo carousel, inline
   caption editing, weather tags, spot notes, and directions.

## Searching

The search bar (`PlaceSearch.tsx`) suggests matching saved spots plus real places
from `places.search` (`server/routers/places.ts`). UK postcodes go to
postcodes.io; everything else goes to Photon, a free OpenStreetMap search API,
ranked towards central London. Picking a place drops a marker with an
**Add spot here** shortcut; parks and other areas are framed whole. Requests are
debounced and cached to stay within Photon's fair-use limits.

## Adding a spot

1. **Add spot** (bottom right of the map) switches to placing mode: a fixed crosshair
   sits in the middle of the map and you move the map under it. The search box
   at the top jumps to a place or postcode.
2. **Use this spot** opens the form (`add-spot/AddSpotForm.tsx`) with the pin's
   coordinates. The nearest postcode is filled in automatically.
3. On save, each photo is shrunk to 2048px in the browser (`lib/resize-image.ts`)
   and uploaded straight to Vercel Blob. `app/api/spot-photos/upload/route.ts`
   only hands out the upload token. Then `spots.create` inserts the spot and its
   photos in one transaction, and the page opens the new spot.

Setup: create a **public** Blob store in the Vercel dashboard (Storage → Blob),
connect it to the project, and put `BLOB_READ_WRITE_TOKEN` in `.env.local`
(`vercel env pull` does this). Restart `pnpm dev` after adding it.

## Editing a spot

On a spot's page (local only, like all edits):

- **Pencil** in the header opens one edit screen (`EditSpotButton.tsx`) for the name,
  weather and photos. Photos can only be removed here (which also deletes the file
  from Vercel Blob). Nothing is applied until **Save changes**, which calls
  `spots.update` and `deletePhoto` as needed. Photo notes are edited inline on the
  spot page and photos are added with the + tile under the thumbnails.

Uploads share `lib/upload-spot-photo.ts` with the Add spot form.

## Notes

- Map tiles come from OpenFreeMap's free dark style (no API key). Keep the
  attribution control visible.
- `maplibre-gl` is pinned to v5. v6 loads its worker from a separate file that
  Turbopack doesn't resolve, so the map fails with "Worker failed to load".
- The site navigation bar sits above the full-screen map (`zIndex: 1` in
  `NavigationBar.tsx`); `MAP_OVERLAY_TOP_OFFSET` leaves room for it.
