import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { paths } from "../../lib/paths";
import type { ProfessionalListItem } from "../../api/professionals";

// Bundle marker assets via Vite instead of pointing at an external CDN (unpkg) —
// a blocked or slow CDN request would otherwise crash the whole map at runtime.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const founderIcon = new L.Icon({
  iconUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  className: "hue-rotate-[220deg]",
});

// Leaflet's Marker applies `options.icon` via a plain object merge, so an explicit
// `icon={undefined}` prop (rather than the prop being entirely absent) overwrites the
// built-in default icon with `undefined` and crashes on render. Always pass a concrete icon.
const defaultIcon = new L.Icon.Default();

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface Props {
  professionals: ProfessionalListItem[];
  center: [number, number];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function ExplorerMap({ professionals, center, selectedId, onSelect }: Props) {
  const withCoords = professionals.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      {withCoords.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude as number, p.longitude as number]}
          icon={p.isFounder ? founderIcon : defaultIcon}
          eventHandlers={{ click: () => onSelect?.(p.id) }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold text-ink">{p.companyName}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Star size={12} className="fill-warning text-warning" /> {p.rating || "—"} · {p.city}
              </p>
              {p.minPrice != null && <p className="mt-1 text-sm font-medium">Dès {p.minPrice} €</p>}
              <Link to={paths.professional(p.slug)} className="mt-2 block text-center text-sm font-medium text-primary hover:underline">
                Voir le profil
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
