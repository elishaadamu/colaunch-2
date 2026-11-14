import PlannerArt from "./PlannerArt";
import TrackerArt from "./TrackerArt";
import DashboardArt from "./DashboardArt";
import CommunityArt from "./CommunityArt";
import LibraryArt from "./LibraryArt";
import MobileArt from "./MobileArt";
import { kindOf, normalizeBrandHex } from "./helpers";

const ART_BY_KIND = {
  Planner: PlannerArt,
  Tracker: TrackerArt,
  Dashboard: DashboardArt,
  Community: CommunityArt,
  Library: LibraryArt,
  Mobile: MobileArt,
};

const VARIANT_ART_CYCLE = ["Planner", "Dashboard", "Library"];

export default function HeroIllustration({ concept, conceptIndex = null, brandColor, labels, title }) {
  const kind = kindOf(concept);
  let resolvedKind = kind;
  if (Number.isInteger(conceptIndex)) {
    const slot = ((conceptIndex % 3) + 3) % 3;
    if (kind === "Dashboard") {
      resolvedKind = VARIANT_ART_CYCLE[slot];
    } else if (slot === 1 && kind === "Planner") {
      resolvedKind = "Dashboard";
    } else if (slot === 2 && (kind === "Planner" || kind === "Tracker")) {
      resolvedKind = "Library";
    }
  }
  const ArtComponent = ART_BY_KIND[resolvedKind] || DashboardArt;
  const brand = normalizeBrandHex(brandColor);
  return <ArtComponent brand={brand} labels={labels} title={title} />;
}
