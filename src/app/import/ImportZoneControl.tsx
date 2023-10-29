import styled from "styled-components";
import { Rectangle, Zones } from "../types";

function pc(n: number | null) {
  if (n == null) return "*";
  const formatter = new Intl.NumberFormat("en-US", { style: "percent" });
  return formatter.format(n).slice(0, -1);
}
function rectStr(rect: Rectangle) {
  return `<${pc(rect.x1)},${pc(rect.y1)}> - <${pc(rect.x2)},${pc(rect.y2)}>`;
}

function ZoneControl({
  previewAvailable,
  zones,
  addEmptyZone,
  selectedZone,
  setSelectedZone,
  ...rest
}: {
  previewAvailable: boolean;
  zones: Zones;
  selectedZone: number | null;
  setSelectedZone: (zone: number | null) => void;
  addEmptyZone: () => void;
}) {
  return (
    <div {...rest}>
      <div>Zones:</div>
      {zones.zones.map((zone) => {
        return (
          <div
            className={
              zone.key === selectedZone
                ? "zone-button active-zone"
                : "zone-button"
            }
            key={zone.key}
            onClick={() => {
              setSelectedZone(zone.key);
            }}
          >
            {rectStr(zone.rectangle)}
          </div>
        );
      })}
      {zones.inProgressZone && (
        <div
          className="zone-button active-zone"
          key={`ipz${zones.inProgressZone.key}`}
        >
          {rectStr(zones.inProgressZone.rectangle)}
        </div>
      )}
      {previewAvailable && !zones.inProgressZone && (
        <div
          className="zone-button"
          key="anz"
          onClick={() => {
            setSelectedZone(null);
            addEmptyZone();
          }}
        >
          Add new zone
        </div>
      )}
    </div>
  );
}

export const StyledZoneControl = styled(ZoneControl)`
  border: 1px solid;
  padding: 0.5em;
  margin: 1em 0 0 0;

  .zone-button {
    border: 1px solid;
    background: #bbbbbb;
    padding: 0.2em;
    margin: 0.5em 0 0 0;
  }

  .active-zone {
    background: #dddddd !important;
  }
`;
