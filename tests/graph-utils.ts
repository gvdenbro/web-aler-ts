import fs from 'fs';
import { TopLevelSpec, compile } from 'vega-lite';
import { Loader, loader, read, parse, View } from 'vega';

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
  });
}

export function generatePng(dataFilePath: string, pngFilePath: string, dataParseConfig: any, vegaLiteSpec: (data: object[]) => TopLevelSpec): void {

  const csvloader: Loader = loader({ mode: 'file' });
  csvloader.load(dataFilePath).then(data => {
    const csvdata = read(data, { type: 'csv', parse: dataParseConfig });
    const spec = vegaLiteSpec(csvdata);

    const vegaSpec = compile(spec, {}).spec;
    const view = new View(parse(vegaSpec), { renderer: 'none' });
    view.toCanvas().then(canvas => {
      const file = fs.createWriteStream(pngFilePath);
      // @ts-ignore
      const stream = canvas.createPNGStream();
      stream.pipe(file);
    });
  });
}
