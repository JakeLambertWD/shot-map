"use client";

import { api } from "@/app/providers";
import type { PlaceResult } from "@/server/routers/places";
import type { SpotSummary } from "@/server/routers/spots";
import {
  ActionIcon,
  CloseButton,
  Combobox,
  Group,
  Loader,
  Text,
  TextInput,
  useCombobox,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconMapPin, IconMicrophone, IconPhoto, IconSearch } from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MAX_SPOT_MATCHES, PLACE_SEARCH_DEBOUNCE_MS } from "./PlaceSearch.constants";

type SpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// Chrome and Safari only expose speech recognition under the webkit prefix.
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

type PlaceSearchProps = {
  placeholder: string;
  // Saved spots to suggest alongside places. Leave out to only search places.
  spots?: SpotSummary[];
  onSelectPlace: (place: PlaceResult) => void;
  onSelectSpot?: (spot: SpotSummary) => void;
  onClear?: () => void;
};

function findMatchingSpots(spots: SpotSummary[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return [];

  return spots
    .filter((spot) =>
      [spot.title, spot.postcode ?? "", ...spot.tags].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
    .slice(0, MAX_SPOT_MATCHES);
}

export function PlaceSearch({
  placeholder,
  spots,
  onSelectPlace,
  onSelectSpot,
  onClear,
}: PlaceSearchProps) {
  const theme = useMantineTheme();
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });

  const [search, setSearch] = useState("");
  const [isListening, setIsListening] = useState(false);
  const canListen = useSyncExternalStore(
    () => () => undefined,
    () => getSpeechRecognition() !== null,
    () => false,
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);
  const [debouncedSearch] = useDebouncedValue(search.trim(), PLACE_SEARCH_DEBOUNCE_MS);

  const placesQuery = api.places.search.useQuery(
    { query: debouncedSearch },
    {
      enabled: debouncedSearch.length >= 2,
      staleTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
      retry: false,
    },
  );

  const matchingSpots = spots ? findMatchingSpots(spots, search) : [];
  const places = debouncedSearch.length >= 2 ? (placesQuery.data ?? []) : [];
  const isSearching = placesQuery.isFetching && debouncedSearch.length >= 2;

  function handleOptionSubmit(value: string) {
    const [kind, id] = value.split(":", 2);

    if (kind === "spot") {
      const spot = matchingSpots.find((match) => match.id === id);
      if (spot) {
        setSearch(spot.title);
        onSelectSpot?.(spot);
      }
    } else {
      const place = places.find((match) => match.id === id);
      if (place) {
        setSearch(place.name);
        onSelectPlace(place);
      }
    }

    combobox.closeDropdown();
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results, (result) => result[0].transcript).join("");
      setSearch(transcript);
      combobox.openDropdown();
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function clear() {
    setSearch("");
    combobox.closeDropdown();
    onClear?.();
  }

  const hasResults = matchingSpots.length > 0 || places.length > 0;

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit} zIndex={300}>
      <Combobox.Target>
        <TextInput
          aria-label={placeholder}
          placeholder={placeholder}
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          leftSection={<IconSearch size={18} />}
          rightSection={
            isSearching ? (
              <Loader size="xs" color="yellow" />
            ) : search && !isListening ? (
              <CloseButton aria-label="Clear search" onClick={clear} />
            ) : canListen ? (
              <ActionIcon
                aria-label={isListening ? "Stop voice search" : "Search by voice"}
                aria-pressed={isListening}
                variant={isListening ? "filled" : "subtle"}
                color={isListening ? "red" : "brown.0"}
                radius="xl"
                onMouseDown={(event) => event.preventDefault()}
                onClick={toggleListening}
              >
                <IconMicrophone size={18} />
              </ActionIcon>
            ) : null
          }
          size="md"
          radius="xl"
          styles={{
            input: {
              backgroundColor: theme.colors.brown[7],
              borderColor: theme.colors.brown[4],
              color: theme.colors.brown[0],
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
            },
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown hidden={search.trim().length < 2}>
        <Combobox.Options mah="50vh" style={{ overflowY: "auto" }}>
          {matchingSpots.length > 0 && (
            <Combobox.Group label="Your spots">
              {matchingSpots.map((spot) => (
                <Combobox.Option key={spot.id} value={`spot:${spot.id}`}>
                  <Group gap="sm" wrap="nowrap">
                    <IconPhoto size={18} color={theme.colors.yellow[5]} aria-hidden />
                    <div>
                      <Text fz="sm" fw={500}>
                        {spot.title}
                      </Text>
                      {spot.postcode && (
                        <Text fz="xs" c="dimmed">
                          {spot.postcode}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Combobox.Option>
              ))}
            </Combobox.Group>
          )}

          {places.length > 0 && (
            <Combobox.Group label="Places">
              {places.map((place) => (
                <Combobox.Option key={place.id} value={`place:${place.id}`}>
                  <Group gap="sm" wrap="nowrap">
                    <IconMapPin size={18} aria-hidden />
                    <div>
                      <Text fz="sm" fw={500}>
                        {place.name}
                      </Text>
                      {place.description && (
                        <Text fz="xs" c="dimmed">
                          {place.description}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Combobox.Option>
              ))}
            </Combobox.Group>
          )}

          {!hasResults && !isSearching && (
            <Combobox.Empty>
              {placesQuery.isError ? "Place search isn't available right now" : "No matches"}
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
