"use client";

import { api } from "@/app/providers";
import type { SpotSummary } from "@/server/routers/spots";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { PlaceResult } from "@/server/routers/places";
import {
  IconAdjustmentsHorizontal,
  IconArrowsMove,
  IconCalendar,
  IconCheck,
  IconCurrentLocation,
  IconLibraryPhoto,
  IconPlus,
} from "@tabler/icons-react";
import { findNearestPostcode } from "@/lib/postcodes";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import MapGL, { AttributionControl, Marker, type MapRef } from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import { AddSpotForm, type DraftLocation } from "./add-spot/AddSpotForm";
import { PlacementCrosshair } from "./add-spot/PlacementCrosshair";
import { SPOT_FORM_MODAL_TITLE_STYLES, SpotFormModalTitle } from "./add-spot/SpotFormModalTitle";
import { ClusterMarker } from "./ClusterMarker";
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  INITIAL_VIEW_STATE,
  LAST_SPOT_STORAGE_KEY,
  MAP_MAX_ZOOM,
  MAP_OVERLAY_BOTTOM_OFFSET,
  MAP_OVERLAY_TOP_OFFSET,
  USER_LOCATION_ZOOM,
} from "./PhotoSpotsMap.constants";
import { PlaceSearch } from "./PlaceSearch";
import { PLACE_ZOOM } from "./PlaceSearch.constants";
import { SearchedPlaceMarker } from "./SearchedPlaceMarker";
import { MAP_COLOURS, useMapStyle } from "./mapStyle";
import { useTodayShoot } from "../today/useTodayShoot";
import { ActiveFilterChips, FilterResultCount } from "./filters/ActiveFilters";
import { SpotFilterSheet } from "./filters/SpotFilterSheet";
import {
  countActiveFilters,
  EMPTY_SPOT_FILTERS,
  matchesSpotFilters,
} from "./filters/SpotFilters.constants";
import { useSpotFilters } from "./filters/useSpotFilters";

const ADD_SPOT_FORM_ID = "add-spot-form";
import { SpotMarker } from "./SpotMarker";

type Bounds = [west: number, south: number, east: number, north: number];

type Viewport = {
  bounds: Bounds;
  zoom: number;
};

// closed: browsing the map. details: filling in the form for the spot under the crosshair.
type AddSpotStep = "closed" | "details";

type UserLocation = {
  longitude: number;
  latitude: number;
};

export function PhotoSpotsMap() {
  const theme = useMantineTheme();
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const hasAutoLocated = useRef(false);

  const utils = api.useUtils();
  const spotsQuery = api.spots.list.useQuery();
  const moveSpot = api.spots.move.useMutation();
  const mapStyle = useMapStyle();
  const shoot = useTodayShoot();
  // Posts waiting to go out, counted on the Upcoming button.
  const upcomingCount = api.upcomingPosts.list.useQuery().data?.length ?? 0;

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [searchedPlace, setSearchedPlace] = useState<PlaceResult | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addSpotStep, setAddSpotStep] = useState<AddSpotStep>("closed");
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);
  const [isSavingSpot, setIsSavingSpot] = useState(false);
  // The place the user searched for, used to pre-fill the new spot's name.
  const [draftPlaceName, setDraftPlaceName] = useState<string | null>(null);

  // Set when opened from a spot's "Move pin": the map then repositions that spot instead.
  // Read from the URL on every render: Next.js can keep this page mounted between visits.
  const movingSpotId = useSearchParams().get("move");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isSavingMove, setIsSavingMove] = useState(false);
  // The spot the map last centred on for a move, so each new move starts on its spot.
  const centredMoveSpotId = useRef<string | null>(null);

  const [filters, setFilters] = useSpotFilters();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const spots = useMemo(() => spotsQuery.data ?? [], [spotsQuery.data]);
  const movingSpot = movingSpotId ? spots.find((spot) => spot.id === movingSpotId) : undefined;
  const isMoving = Boolean(movingSpotId);
  // Filters are paused while moving a pin so every spot stays visible for reference.
  const activeFilterCount = isMoving ? 0 : countActiveFilters(filters);

  // Spots that match the filters get full pins; the rest shrink to small dots.
  const [matchingSpots, filteredOutSpots] = useMemo(() => {
    if (movingSpotId) return [spots.filter((spot) => spot.id !== movingSpotId), []];
    if (activeFilterCount === 0) return [spots, []];
    const matching: SpotSummary[] = [];
    const filteredOut: SpotSummary[] = [];
    for (const spot of spots) {
      (matchesSpotFilters(spot, filters) ? matching : filteredOut).push(spot);
    }
    return [matching, filteredOut];
  }, [spots, filters, activeFilterCount, movingSpotId]);

  // Leaving move mode clears it, so moving the same spot again re-centres on it.
  useEffect(() => {
    if (!movingSpotId) centredMoveSpotId.current = null;
  }, [movingSpotId]);

  // Start the move with the spot's current position under the crosshair.
  useEffect(() => {
    if (!movingSpot || !isMapLoaded || centredMoveSpotId.current === movingSpot.id) return;
    centredMoveSpotId.current = movingSpot.id;
    mapRef.current?.jumpTo({
      center: [movingSpot.longitude, movingSpot.latitude],
      zoom: PLACE_ZOOM,
    });
  }, [movingSpot, isMapLoaded]);

  const visibleFilteredOutSpots = useMemo(() => {
    if (!viewport) return [];
    const [west, south, east, north] = viewport.bounds;
    return filteredOutSpots.filter(
      (spot) =>
        spot.longitude >= west &&
        spot.longitude <= east &&
        spot.latitude >= south &&
        spot.latitude <= north,
    );
  }, [filteredOutSpots, viewport]);

  // Rebuild the cluster index only when the set of pins changes, not on every pan.
  const clusterIndex = useMemo(() => {
    const index = new Supercluster<{ spot: SpotSummary }>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
    });

    index.load(
      matchingSpots.map((spot) => ({
        type: "Feature",
        properties: { spot },
        geometry: { type: "Point", coordinates: [spot.longitude, spot.latitude] },
      })),
    );

    return index;
  }, [matchingSpots]);

  const clusters = useMemo(
    () => (viewport ? clusterIndex.getClusters(viewport.bounds, Math.ceil(viewport.zoom)) : []),
    [clusterIndex, viewport],
  );

  function handleLoad(event: { target: MapLibreMap }) {
    updateViewport(event);
    setIsMapLoaded(true);

    // MapLibre opens the compact credits on wide screens; start them collapsed to the "i" button.
    event.target
      .getContainer()
      .querySelector(".maplibregl-ctrl-attrib")
      ?.classList.remove("maplibregl-compact-show");

    if (!hasAutoLocated.current && !movingSpotId) {
      hasAutoLocated.current = true;

      const lastSpot = sessionStorage.getItem(LAST_SPOT_STORAGE_KEY);
      sessionStorage.removeItem(LAST_SPOT_STORAGE_KEY);

      if (lastSpot) {
        const [longitude, latitude, zoom] = JSON.parse(lastSpot) as [number, number, number?];
        event.target.jumpTo({ center: [longitude, latitude], ...(zoom && { zoom }) });
      } else {
        locateUser(true);
      }
    }
  }

  function updateViewport({ target: map }: { target: MapLibreMap }) {
    const bounds = map.getBounds();

    setViewport({
      bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom: map.getZoom(),
    });
  }

  function zoomIntoCluster(clusterId: number, longitude: number, latitude: number) {
    const zoom = Math.min(clusterIndex.getClusterExpansionZoom(clusterId), MAP_MAX_ZOOM);
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: 600 });
  }

  // isAutomatic is the lookup on first load: it jumps straight there and stays quiet if it fails.
  function locateUser(isAutomatic = false) {
    if (!("geolocation" in navigator)) {
      if (!isAutomatic) setLocationError("Location isn't available in this browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { longitude: coords.longitude, latitude: coords.latitude };
        setUserLocation(location);
        setLocationError(null);
        setIsLocating(false);
        const view = {
          center: [location.longitude, location.latitude] as [number, number],
          zoom: USER_LOCATION_ZOOM,
        };
        if (isAutomatic) mapRef.current?.jumpTo(view);
        else mapRef.current?.flyTo(view);
      },
      () => {
        if (!isAutomatic) setLocationError("Couldn't get your location");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function confirmPlacement() {
    const center = mapRef.current?.getCenter();
    if (!center) return;

    setDraftLocation({ latitude: center.lat, longitude: center.lng });
    setDraftPlaceName(searchedPlace?.name ?? null);
    setAddSpotStep("details");
  }

  function goToPlace(place: PlaceResult) {
    const map = mapRef.current;
    if (!map) return;

    // Areas such as parks get framed whole; single buildings get a close zoom.
    if (place.bounds) {
      const [west, south, east, north] = place.bounds;
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: 80, maxZoom: PLACE_ZOOM },
      );
    } else {
      map.flyTo({ center: [place.longitude, place.latitude], zoom: PLACE_ZOOM });
    }
  }

  function showPlace(place: PlaceResult) {
    setSearchedPlace(place);
    goToPlace(place);
  }

  function showSpot(spot: SpotSummary) {
    setSearchedPlace(null);
    mapRef.current?.flyTo({ center: [spot.longitude, spot.latitude], zoom: PLACE_ZOOM });
  }

  function leaveMoveMode() {
    if (movingSpotId) router.replace(`/${movingSpotId}`);
  }

  async function saveMove() {
    const map = mapRef.current;
    if (!movingSpotId || !map) return;
    const { lat, lng } = map.getCenter();

    setIsSavingMove(true);
    try {
      const postcode = await findNearestPostcode(lat, lng).catch(() => null);
      await moveSpot.mutateAsync({ id: movingSpotId, latitude: lat, longitude: lng, postcode });
      await utils.spots.invalidate();
      // Coming back to the map from the spot page centres on its new position.
      sessionStorage.setItem(LAST_SPOT_STORAGE_KEY, JSON.stringify([lng, lat, map.getZoom()]));
      leaveMoveMode();
    } catch {
      // The error message shows above the buttons.
    } finally {
      setIsSavingMove(false);
    }
  }

  function closeAddSpot() {
    setAddSpotStep("closed");
    setDraftLocation(null);
    setDraftPlaceName(null);
  }

  // After saving, stay on the map and centre it on the new spot.
  function handleSpotCreated() {
    const location = draftLocation;
    closeAddSpot();
    setSearchedPlace(null);
    if (location) {
      mapRef.current?.flyTo({ center: [location.longitude, location.latitude], zoom: PLACE_ZOOM });
    }
  }

  return (
    <Box pos="fixed" inset={0} bg={MAP_COLOURS.land}>
      {mapStyle && (
        <MapGL
          ref={mapRef}
          initialViewState={INITIAL_VIEW_STATE}
          maxZoom={MAP_MAX_ZOOM}
          mapStyle={mapStyle}
          attributionControl={false}
          onLoad={handleLoad}
          onMove={updateViewport}
          style={{ width: "100%", height: "100%" }}
        >
          <AttributionControl
            position="bottom-left"
            compact
            // Centres the 24px credits button on the 56px buttons row, 1.5rem in from the edge.
            style={{ margin: `0 0 calc(${MAP_OVERLAY_BOTTOM_OFFSET} + 16px) 1.5rem` }}
          />

          {movingSpot && (
            <Marker longitude={movingSpot.longitude} latitude={movingSpot.latitude}>
              <Box aria-hidden style={{ opacity: 0.45, pointerEvents: "none" }}>
                <SpotMarker spot={movingSpot} onSelect={() => {}} />
              </Box>
            </Marker>
          )}

          {visibleFilteredOutSpots.map((spot) => (
            <Marker key={`filtered-${spot.id}`} longitude={spot.longitude} latitude={spot.latitude}>
              <Box
                aria-hidden
                w={16}
                h={16}
                bdrs="50%"
                bg="brown.6"
                style={{ border: `1.5px solid ${theme.colors.brown[2]}`, pointerEvents: "none" }}
              />
            </Marker>
          ))}

          {clusters.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates;
            const properties = feature.properties;

            if ("cluster" in properties && properties.cluster) {
              return (
                <Marker
                  key={`cluster-${properties.cluster_id}`}
                  longitude={longitude}
                  latitude={latitude}
                >
                  <ClusterMarker
                    count={properties.point_count}
                    onSelect={() => zoomIntoCluster(properties.cluster_id, longitude, latitude)}
                  />
                </Marker>
              );
            }

            const { spot } = properties as { spot: SpotSummary };

            return (
              <Marker key={spot.id} longitude={spot.longitude} latitude={spot.latitude}>
                <SpotMarker
                  spot={spot}
                  shootNumber={shoot.indexOf(spot.id) + 1 || undefined}
                  isShot={Boolean(shoot.spots[shoot.indexOf(spot.id)]?.shotAt)}
                  onSelect={() => {
                    sessionStorage.setItem(
                      LAST_SPOT_STORAGE_KEY,
                      JSON.stringify([spot.longitude, spot.latitude, mapRef.current?.getZoom()]),
                    );
                    router.push(`/${spot.id}`);
                  }}
                />
              </Marker>
            );
          })}

          {searchedPlace && (
            <Marker
              longitude={searchedPlace.longitude}
              latitude={searchedPlace.latitude}
              anchor="bottom"
            >
              <SearchedPlaceMarker place={searchedPlace} />
            </Marker>
          )}

          {userLocation && (
            <Marker longitude={userLocation.longitude} latitude={userLocation.latitude}>
              <Box
                role="img"
                aria-label="Your location"
                w={18}
                h={18}
                bdrs="50%"
                bg="blue.4"
                style={{ border: `3px solid ${theme.colors.brown[0]}` }}
              />
            </Marker>
          )}
        </MapGL>
      )}

      {CAN_EDIT_SPOTS && (addSpotStep !== "details" || isMoving) && <PlacementCrosshair />}

      <Box pos="absolute" top={MAP_OVERLAY_TOP_OFFSET} left={0} right={0} px="md">
        <Stack gap="sm" maw="30rem" mx="auto">
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <Box flex={1} miw={0}>
              <PlaceSearch
                placeholder="Search places, postcodes or your spots"
                spots={spots}
                onSelectPlace={showPlace}
                onSelectSpot={showSpot}
                onClear={() => setSearchedPlace(null)}
              />
            </Box>
            {!isMoving && (
              <ActionIcon
                aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} on` : "Filters"}
                aria-haspopup="dialog"
                aria-expanded={isFilterSheetOpen}
                onClick={() => setIsFilterSheetOpen(true)}
                size={42}
                radius="xl"
                pos="relative"
                variant="default"
                style={{ flex: "none", overflow: "visible" }}
                styles={{
                  root: {
                    backgroundColor: theme.colors.brown[7],
                    border: `${activeFilterCount > 0 ? 1.5 : 1}px solid ${
                      activeFilterCount > 0 ? theme.colors.yellow[5] : theme.colors.brown[4]
                    }`,
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
                  },
                }}
              >
                <IconAdjustmentsHorizontal
                  size={20}
                  color={activeFilterCount > 0 ? theme.colors.yellow[5] : theme.colors.brown[0]}
                />
                {activeFilterCount > 0 && (
                  <Center
                    aria-hidden
                    pos="absolute"
                    top={-4}
                    right={-4}
                    w={20}
                    h={20}
                    bg="yellow.5"
                    c="brown.9"
                    fz={11}
                    fw={900}
                    style={{ borderRadius: "50%" }}
                  >
                    {activeFilterCount}
                  </Center>
                )}
              </ActionIcon>
            )}
          </Group>
          {isMoving ? (
            <Paper
              px="md"
              py="sm"
              radius="md"
              bg="brown.7"
              style={{
                border: `1px solid ${theme.colors.yellow[5]}`,
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <IconArrowsMove size={20} color={theme.colors.yellow[5]} style={{ flex: "none" }} />
                <Box miw={0}>
                  <Text fz="sm" fw={700} c="brown.0" truncate>
                    Moving {movingSpot?.title ?? "spot"}
                  </Text>
                  <Text fz="xs" c="brown.1">
                    Drag the map so the crosshair sits on the new position.
                  </Text>
                </Box>
              </Group>
            </Paper>
          ) : (
            <ActiveFilterChips filters={filters} onChange={setFilters} />
          )}
        </Stack>
      </Box>

      {(spotsQuery.isPending || spotsQuery.isError) && (
        <Center pos="absolute" inset={0} style={{ pointerEvents: "none" }}>
          {spotsQuery.isPending ? (
            <Loader color="yellow" />
          ) : (
            <Paper p="md" maw="20rem" bg="brown.7" withBorder style={{ pointerEvents: "auto" }}>
              <Text fw={600} c="brown.0">
                Couldn&apos;t load your spots
              </Text>
              <Text fz="sm" c="brown.1">
                {spotsQuery.error?.message}
              </Text>
            </Paper>
          )}
        </Center>
      )}

      <Box pos="absolute" bottom={MAP_OVERLAY_BOTTOM_OFFSET} left={0} right={0} px="md">
        {activeFilterCount > 0 && (
          <Box mb="md">
            <FilterResultCount
              shown={matchingSpots.length}
              total={spots.length}
              onClear={() => setFilters(EMPTY_SPOT_FILTERS)}
            />
          </Box>
        )}
        {isMoving ? (
          <Stack gap="xs" maw="30rem" mx="auto">
            {moveSpot.isError && (
              <Text fz="sm" c="red.4" ta="center">
                Couldn&apos;t move the pin. Try again.
              </Text>
            )}
            <Group gap="sm" align="stretch" wrap="nowrap">
              <Button
                size="lg"
                radius="sm"
                variant="outline"
                color={theme.colors.brown[3]}
                c="brown.0"
                bg="brown.7"
                onClick={leaveMoveMode}
                disabled={isSavingMove}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                size="lg"
                radius="sm"
                autoContrast
                leftSection={<IconCheck size={18} />}
                loading={isSavingMove}
                disabled={!movingSpot}
                onClick={saveMove}
              >
                Save position
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="sm">
            {/* Floats above the bar on the right, leaving the bar room for its labels. */}
            <Group justify="flex-end" style={{ pointerEvents: "none" }}>
              <Tooltip label={locationError ?? "Centre on my location"}>
                <ActionIcon
                  aria-label={locationError ?? "Centre on my location"}
                  onClick={() => locateUser()}
                  loading={isLocating}
                  variant="default"
                  size={56}
                  radius="sm"
                  styles={{
                    root: {
                      backgroundColor: theme.colors.brown[7],
                      borderColor: theme.colors.brown[4],
                      pointerEvents: "auto",
                    },
                  }}
                >
                  <IconCurrentLocation size={22} color={theme.colors.brown[0]} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap="xs" align="stretch" justify="flex-end" wrap="nowrap">
              {/* Content captured and waiting to be posted. */}
              <Button
                component={Link}
                href="/upcoming"
                h="auto"
                px="sm"
                radius="sm"
                variant="default"
                leftSection={<IconLibraryPhoto size={18} color={theme.colors.yellow[5]} />}
                rightSection={
                  upcomingCount > 0 ? (
                    <Text
                      component="span"
                      fz="xs"
                      fw={900}
                      c="brown.9"
                      bg="yellow.5"
                      px={6}
                      miw={22}
                      ta="center"
                      style={{ borderRadius: 11, lineHeight: "22px" }}
                    >
                      {upcomingCount}
                    </Text>
                  ) : null
                }
                styles={{
                  root: {
                    backgroundColor: theme.colors.brown[7],
                    borderColor: theme.colors.brown[4],
                    color: theme.colors.brown[0],
                  },
                  section: { marginInlineStart: 8 },
                }}
              >
                Upcoming
              </Button>
              {/* Today's shoot, with how many spots are on it. */}
              <Button
                component={Link}
                href="/today"
                h="auto"
                px="sm"
                radius="sm"
                variant="default"
                leftSection={<IconCalendar size={18} color={theme.colors.yellow[5]} />}
                rightSection={
                  shoot.spots.length > 0 ? (
                    <Text
                      component="span"
                      fz="xs"
                      fw={900}
                      c="brown.9"
                      bg="yellow.5"
                      px={6}
                      miw={22}
                      ta="center"
                      style={{ borderRadius: 11, lineHeight: "22px" }}
                    >
                      {shoot.spots.length}
                    </Text>
                  ) : null
                }
                styles={{
                  root: {
                    backgroundColor: theme.colors.brown[7],
                    borderColor:
                      shoot.spots.length > 0 ? theme.colors.yellow[5] : theme.colors.brown[4],
                    color: theme.colors.brown[0],
                  },
                }}
              >
                Today
              </Button>
              {CAN_EDIT_SPOTS && (
                <Tooltip label="Add spot">
                  <ActionIcon
                    aria-label="Add spot"
                    onClick={confirmPlacement}
                    size={56}
                    radius="sm"
                    color="yellow.5"
                  >
                    <IconPlus size={24} stroke={2.6} color={theme.colors.brown[9]} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Stack>
        )}
      </Box>

      <SpotFilterSheet
        opened={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={setFilters}
        spots={spots}
      />

      <Modal
        opened={addSpotStep === "details" && draftLocation !== null}
        onClose={closeAddSpot}
        title={
          <SpotFormModalTitle title="New spot" formId={ADD_SPOT_FORM_ID} isSaving={isSavingSpot} />
        }
        size="lg"
        yOffset="var(--mantine-spacing-lg)"
        styles={{
          content: {
            height: "calc(100dvh - 2 * var(--mantine-spacing-lg))",
            display: "flex",
            flexDirection: "column",
          },
          title: SPOT_FORM_MODAL_TITLE_STYLES,
          body: { flex: 1, minHeight: 0, overflowY: "auto" },
        }}
        closeOnClickOutside={false}
      >
        {draftLocation && (
          <AddSpotForm
            location={draftLocation}
            formId={ADD_SPOT_FORM_ID}
            onSavingChange={setIsSavingSpot}
            initialTitle={draftPlaceName ?? ""}
            onCreated={handleSpotCreated}
          />
        )}
      </Modal>
    </Box>
  );
}
