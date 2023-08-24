import fs from 'fs';
import { TopLevelSpec, compile } from 'vega-lite';
import { Loader, loader, read, parse, View } from 'vega';
import svg2img from 'svg2img'

export function generateSvg(dataFilePath: string, svgFilePath: string, dataParseConfig: any, vegaLiteSpec: (data: object[]) => TopLevelSpec): void {

  const csvloader: Loader = loader({ mode: 'file' });
  csvloader.load(dataFilePath).then(data => {
    const csvdata = read(data, { type: 'csv', parse: dataParseConfig });
    const spec = vegaLiteSpec(csvdata);

    const vegaSpec = compile(spec, {}).spec;
    const view = new View(parse(vegaSpec), { renderer: 'none' });
    view.toSVG().then(svg => {
      fs.writeFileSync(svgFilePath, svg);
    });
    // hack in order to have a png version for telegram
    // vega-lite can generate png with the help of a 'canvas' lib, but results are not great
    // so using vega-lite to export to svg and use svg2img to convert to png 🤮
    svg2img(svgFilePath, function (error, buffer) {
      fs.writeFileSync(svgFilePath.replace('.svg', '.png'), buffer);
    });
  });
}
