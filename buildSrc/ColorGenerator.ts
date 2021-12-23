import path from "path";
import fs from "fs";
import {masterThemesDirectory, walkAndBuildTemplates} from "./BuildFunctions";
import {MasterDokiThemeDefinition} from "doki-build-source";

console.log("Preparing to create color.");

type RGBArray = [number, number, number, number];

function hex_to_rgba(a: string): RGBArray {
  '#' == a[0] && (a = a.substring(1));
  6 > a.length && (a += '000000'.substr(0, 6 - a.length));
  return [parseInt(a.substring(0, 2), 16),
    parseInt(a.substring(2, 4), 16),
    parseInt(a.substring(4, 6), 16),
    a.length > 6 ? parseInt(a.substring(6, 8), 16) : 0xFF
  ];
}

function rgb_to_hex(a: RGBArray) {
  const b = (a[2] | a[1] << 8 | a[0] << 16).toString(16);
  return '000000'.substr(0, 6 - b.length) + b;
}

function blendColors(
  base: RGBArray,
  added: RGBArray,
): RGBArray {
  const mix = [];
  const overlayAlpha = added[3] / 0xFF;
  const baseAlpha = base[3] / 0xFF;
  mix[3] = 1 - (1 - overlayAlpha) * (1 - baseAlpha); // alpha
  mix[0] = Math.round((added[0] * overlayAlpha / mix[3]) + (base[0] * baseAlpha * (1 - overlayAlpha) / mix[3])); // red
  mix[1] = Math.round((added[1] * overlayAlpha / mix[3]) + (base[1] * baseAlpha * (1 - overlayAlpha) / mix[3])); // green
  mix[2] = Math.round((added[2] * overlayAlpha / mix[3]) + (base[2] * baseAlpha * (1 - overlayAlpha) / mix[3])); // blue
  return mix as RGBArray;
}

function addNewColor(dokiTheme: { dokiThemeDefinition: MasterDokiThemeDefinition; dokiFileDefinitionPath: string }) {
  if(dokiTheme.dokiThemeDefinition.dark) return;

  const baseColor = hex_to_rgba(
    dokiTheme.dokiThemeDefinition.colors.headerColor
  );
  const overlayColor = hex_to_rgba(
    "#1a8bff30",
)
  const gray = hex_to_rgba("#6f6f6f30")
  const orange = hex_to_rgba("#e57e1a50")
  const rose = hex_to_rgba("#c03a7f30")
  const violet = hex_to_rgba("#6441d030")
  const blendedColor = blendColors(baseColor, overlayColor);
  const newColor = rgb_to_hex(blendedColor);

  // dokiTheme.dokiThemeDefinition.colors["fileBlue"] = '#' + newColor
  // dokiTheme.dokiThemeDefinition.colors["fileGray"] = '#' + rgb_to_hex(blendColors(baseColor, gray))
  // dokiTheme.dokiThemeDefinition.colors["fileRose"] = '#' + rgb_to_hex(blendColors(baseColor, rose))
  dokiTheme.dokiThemeDefinition.colors["fileOrange"] = '#' + rgb_to_hex(blendColors(baseColor, orange))
  // dokiTheme.dokiThemeDefinition.colors["fileViolet"] = '#' + rgb_to_hex(blendColors(baseColor, violet))
}

walkAndBuildTemplates()
  .then((dokiThemes) => {
    return dokiThemes
      .reduce(
        (accum, dokiTheme) =>
          accum.then(() => {
            addNewColor(dokiTheme);
            fs.writeFileSync(dokiTheme.dokiFileDefinitionPath,
              JSON.stringify(dokiTheme.dokiThemeDefinition, null, 2)
            );

            return Promise.resolve("dun")
          }),
        Promise.resolve("")
      );
  })
  .then(() => {
    console.log("Color Creation Complete!");
  });
