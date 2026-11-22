/* Calistar worksheet UI. All the maths lives in calistar-core.js. */
(function () {
  'use strict';
  const C = window.CalistarCore;
  const $ = (id) => document.getElementById(id);
  const STORE = 'calistar.worksheet.v1';
  const MODELS = ['80x2', '100x2', '120x2', '120x3', '140x4', '150x3', '150x5', '180x4', '180x5'];

  /* ------------------------------------------------------------------ */
  /* Text                                                               */
  /* ------------------------------------------------------------------ */
  const TEXT = {
    en: {
      tagline: 'Skew and size calibration worksheet',
      session: 'Session', sessionNew: 'New', sessionDelete: 'Delete', export: 'Export', import: 'Import', theme: 'Light / dark',
      sessionPrompt: 'Name for the new session (for example the filament: "ABS black")',
      sessionDeleteConfirm: 'Delete session "{name}" and its measurements?',
      importError: 'That file is not a Calistar worksheet export.',
      setupTitle: 'What did you print?',
      model: 'Model', modelHint: 'The file name: calistar_120x3.stl is 120x3.', modelCustom: 'Custom…',
      width: 'Total width (mm)', points: 'Measurement points',
      material: 'Filament', materialHint: 'Up to about {max} % shrinkage is normal for {name}.', materialOther: 'No reference value for this material.',
      firmware: 'Firmware', kinematics: 'Kinematics', corexy: 'CoreXY (Voron, Bambu, …)', cartesian: 'Cartesian (bed slinger)',
      advanced: 'Advanced settings',
      caliper: 'Caliper accuracy (mm)', caliperHint: 'Cheap digital calipers show 0.01 but are good to about 0.02.',
      printScale: 'Scale applied in the slicer', printScaleHint: '1 if you did not scale the model (recommended).',
      tolerance: 'Target (mm per 100 mm)', toleranceHint: 'Errors below this are treated as good enough.',
      measureTitle: 'Measure',
      measureLead: 'Let the print cool down completely and take it off the bed first. Click a box to see where to put the calipers. One measurement per row is enough; up to three are averaged. You can skip rows.',
      legendOuter: 'Outer: jaws close on the part', legendInner: 'Inner: jaws open inside the part',
      colNominal: 'Nominal', colDev: 'Difference from nominal', clear: 'Clear measurements', clearConfirm: 'Clear every measurement in this session?',
      g_xo: 'X outer', g_xi: 'X inner', g_yo: 'Y outer', g_yi: 'Y inner', g_D: 'Diagonal D', g_d: 'Diagonal d',
      gh_x: 'left to right', gh_y: 'front to back', gh_D: 'front-left to back-right', gh_d: 'back-left to front-right',
      capIdle: 'Click a measurement box to see where it goes.',
      capRow: '<b>{name}</b> · nominal {nominal} mm<br>{how}',
      howOuter: 'Close the outside jaws on the two marked faces.', howInner: 'Open the inside jaws against the two marked faces.',
      w_needX: 'Add at least one X measurement to get the size along X.',
      w_needY: 'Add at least one Y measurement to get the size along Y.',
      w_needDiagonals: 'Add at least one D and one d measurement to get the skew.',
      w_noOffset: '{axis}: only outer or only inner measurements. Over- or under-extrusion will be mistaken for a size error; measure both for a trustworthy result.',
      w_unpaired: '{axis}: some positions have an outer measurement without its inner one (or the reverse). It still works, but pairs are more precise.',
      w_suspect: 'Rows marked ⚠ do not fit the rest. Check for a typo or measure them again.',
      w_fine: 'Enough measurements for skew and size.',
      resultsTitle: 'Results',
      resultsLead: 'Target: less than {tol} mm of error per 100 mm (±{pct} % in size, ±{deg}° of skew). The whisker is the measurement uncertainty (2σ); the green band is the target.',
      resultsEmpty: 'Results appear here as you type measurements.',
      cardSkew: 'Skew', cardSize: 'Size', cardWall: 'Wall offset',
      skewLine: '{long} is the long diagonal: {mm} mm out of square per 100 mm.',
      skewNone: 'The X and Y axes are square.',
      skewWhat: 'A property of the machine. It is the same for every filament.',
      sizeLine: '{mm} mm on {width} mm.',
      sizeWhat_shrinkage: 'Smaller than the model, within what {material} shrinks when it cools. This depends on the filament.',
      sizeWhat_beyondShrinkage: 'Smaller than the model by more than {material} normally shrinks (about {max} %).',
      sizeWhat_oversize: 'Bigger than the model. Shrinkage cannot do that.',
      sizeWhat_none: 'The size is right.',
      wallLine_pos: 'Walls come out thicker than drawn: outer sizes read {mm} mm long and inner sizes {mm} mm short.',
      wallLine_neg: 'Walls come out thinner than drawn: outer sizes read {mm} mm short and inner sizes {mm} mm long.',
      wallWhat: 'A constant error, the same at 40 mm and at 180 mm. Scaling cannot fix it.',
      wallNone: 'Measure both outer and inner rows to see this.',
      st_ok: 'On target', st_noise: 'Within measuring noise', st_adjust: 'Worth correcting', st_none: 'No data',
      actionsTitle: 'What to change',
      actionsLead: 'In this order. Skew belongs to the printer and is set once. Size belongs to each filament.',
      stepSkewTitle: 'A. Skew — once per printer',
      skew_none: 'Enter the diagonals to get this.',
      skew_ok: 'Nothing to do: the skew is on target.',
      skew_noise: 'Nothing to do: the skew is smaller than what your measurements can resolve. Correcting it would be chasing noise.',
      skew_adjust: 'Correct {deg}° of skew. Use a low-shrink filament such as PLA for this measurement if you can.',
      skewIterate: 'Was skew correction already active when you printed this?',
      skewIterateHint: 'Then enter the three lengths that were loaded (from SET_SKEW, or the [skew_correction] profile in printer.cfg). The new values will add to them instead of replacing them.',
      skewIterateOut: 'Previous correction {prev}° → new total {total}°.',
      klipperSkewHow: 'printer.cfg needs a [skew_correction] section. Then run in the console:',
      klipperSkewLoad: 'Load the profile in your PRINT_START macro, after homing:',
      marlinSkewHow: 'Needs SKEW_CORRECTION enabled in Configuration.h. Assumes no skew factor was set when you printed. Run:',
      stepSizeTitle: 'B. Size — per filament',
      size_none: 'Enter X and Y measurements to get this.',
      size_ok: 'Nothing to do: the size is on target for this filament.',
      size_noise: 'Nothing to do: the size error is smaller than what your measurements can resolve.',
      size_shrinkage: 'The print is {pct} % small, which is normal shrinkage for {material}. Put it in the filament profile of your slicer. Leave the firmware alone: the printer is not wrong, the plastic shrank.',
      size_beyondShrinkage: 'The print is {pct} % small, more than {material} usually shrinks. First rule out a typo and a scaled model. If you measured twice, a slicer shrinkage value still fixes the result for this filament; change the firmware only if every filament shows the same error.',
      size_oversize: 'The print is {pct} % big. Check that no shrinkage compensation is already set too high in the slicer. If not, the steps of the printer are off: correct the firmware.',
      size_differ: 'X and Y differ by {diff} %. Plastic shrinks about the same in both directions, so that part is mechanical: on CoreXY check that both belts have the same tension; on a Cartesian printer correct each axis in the firmware.',
      oneNotBoth: 'Use one of the two options below, never both: each one applies the full correction.',
      optSlicer: 'Option 1 · Shrinkage in the slicer', optFirmware: 'Option 2 · Steps in the firmware', recommended: 'recommended',
      slicer: 'Slicer', slicerOther: 'Other (scale the model)', currentValue: 'Value used for this print',
      cur_orca: 'Blank = 100 % (no compensation).', cur_prusa: 'Blank = 0 % (no compensation).', cur_cura: 'Blank = 100 % (no compensation).', cur_scale: 'Blank = 100 % (not scaled).',
      shrinkLabel_orca: 'Set Shrinkage (XY) to', shrinkLabel_prusa: 'Set Shrinkage compensation XY to', shrinkLabel_cura: 'Set Scaling Factor Shrinkage Compensation to', shrinkLabel_scale: 'Scale every model in X and Y to',
      where_orca: 'Filament settings → Filament → Shrinkage (XY). This print says nothing about Z; leave Shrinkage (Z) as it is.',
      where_prusa: 'Filament settings → Advanced → Shrinkage compensation → XY.',
      where_cura: 'Search the settings for "shrinkage". Cura wants how much to enlarge, so the value is above 100.',
      where_scale: 'Has to be applied to every model you slice with this filament.',
      firmwareWarn: 'Only if the error is the same with every filament. On a belt printer rotation_distance is fixed by the pulley (20 teeth × 2 mm = 40) and should not need tuning.',
      stepsX: 'Current X steps/mm (M92)', stepsY: 'Current Y steps/mm (M92)',
      corexyNote: '# CoreXY: both motors move both axes, so X and Y share one value',
      stepFlowTitle: 'C. Wall offset — flow, not scale',
      flow_none: 'Measure outer and inner rows to see whether walls come out thick or thin.',
      flow_ok: 'Nothing to do: outer and inner sizes agree.',
      flow_noise: 'Nothing to do: the difference between outer and inner sizes is within measuring noise.',
      flow_pos: 'Walls are about {mm} mm too thick in total. This is over-extrusion or the first-layer squish: calibrate the flow (extrusion multiplier), or use the XY contour/hole compensation of your slicer. The size result above already excludes this effect.',
      flow_neg: 'Walls are about {mm} mm too thin in total. This is under-extrusion: calibrate the flow (extrusion multiplier). The size result above already excludes this effect.',
      stepAgainTitle: 'D. Print again and check',
      stepAgainText: 'Print another Calistar with the new settings and measure it in a new session. Fill in the values that were active for that print (shrinkage, AC/BD/AD) so the next correction builds on them. Stop when everything reads "On target" or "Within measuring noise".',
      footer: 'Calistar is free and open source (GPL-3). Measurements are stored only in this browser.', wikiMeasuring: 'Measuring tips',
      copy: 'Copy', copied: 'Copied',
    },
    es: {
      tagline: 'Hoja de calibración de sesgo y dimensiones',
      session: 'Sesión', sessionNew: 'Nueva', sessionDelete: 'Borrar', export: 'Exportar', import: 'Importar', theme: 'Claro / oscuro',
      sessionPrompt: 'Nombre de la nueva sesión (por ejemplo el filamento: "ABS negro")',
      sessionDeleteConfirm: '¿Borrar la sesión "{name}" y sus medidas?',
      importError: 'Ese archivo no es una exportación de esta hoja.',
      setupTitle: '¿Qué imprimiste?',
      model: 'Modelo', modelHint: 'El nombre del archivo: calistar_120x3.stl es 120x3.', modelCustom: 'Personalizado…',
      width: 'Ancho total (mm)', points: 'Puntos de medida',
      material: 'Filamento', materialHint: 'Hasta un {max} % de contracción es normal en {name}.', materialOther: 'Sin valor de referencia para este material.',
      firmware: 'Firmware', kinematics: 'Cinemática', corexy: 'CoreXY (Voron, Bambu, …)', cartesian: 'Cartesiana (cama móvil)',
      advanced: 'Ajustes avanzados',
      caliper: 'Precisión del calibrador (mm)', caliperHint: 'Los digitales baratos muestran 0.01 pero son fiables a unos 0.02.',
      printScale: 'Escala aplicada en el slicer', printScaleHint: '1 si no escalaste el modelo (recomendado).',
      tolerance: 'Meta (mm por cada 100 mm)', toleranceHint: 'Un error menor que esto se considera suficientemente bueno.',
      measureTitle: 'Medir',
      measureLead: 'Deja enfriar la pieza por completo y sácala de la cama antes de medir. Haz clic en una casilla para ver dónde va el calibrador. Basta una medida por fila; si pones hasta tres, se promedian. Puedes dejar filas vacías.',
      legendOuter: 'Exterior: las mordazas cierran sobre la pieza', legendInner: 'Interior: las mordazas abren dentro de la pieza',
      colNominal: 'Nominal', colDev: 'Diferencia con el nominal', clear: 'Borrar medidas', clearConfirm: '¿Borrar todas las medidas de esta sesión?',
      g_xo: 'X exterior', g_xi: 'X interior', g_yo: 'Y exterior', g_yi: 'Y interior', g_D: 'Diagonal D', g_d: 'Diagonal d',
      gh_x: 'de izquierda a derecha', gh_y: 'de adelante hacia atrás', gh_D: 'de adelante-izquierda a atrás-derecha', gh_d: 'de atrás-izquierda a adelante-derecha',
      capIdle: 'Haz clic en una casilla de medida para ver dónde va.',
      capRow: '<b>{name}</b> · nominal {nominal} mm<br>{how}',
      howOuter: 'Cierra las mordazas exteriores sobre las dos caras marcadas.', howInner: 'Abre las mordazas interiores contra las dos caras marcadas.',
      w_needX: 'Añade al menos una medida en X para obtener la dimensión en X.',
      w_needY: 'Añade al menos una medida en Y para obtener la dimensión en Y.',
      w_needDiagonals: 'Añade al menos una medida D y una d para obtener el sesgo.',
      w_noOffset: '{axis}: solo hay medidas exteriores o solo interiores. La sobre o subextrusión se confundirá con un error de dimensión; mide ambas para un resultado fiable.',
      w_unpaired: '{axis}: alguna posición tiene medida exterior sin su interior (o al revés). Funciona, pero en pareja es más preciso.',
      w_suspect: 'Las filas marcadas con ⚠ no encajan con el resto. Revisa si hay un error de tecleo o vuelve a medirlas.',
      w_fine: 'Hay medidas suficientes para sesgo y dimensiones.',
      resultsTitle: 'Resultados',
      resultsLead: 'Meta: menos de {tol} mm de error por cada 100 mm (±{pct} % en dimensión, ±{deg}° de sesgo). El bigote es la incertidumbre de medida (2σ); la banda verde es la meta.',
      resultsEmpty: 'Los resultados aparecen aquí a medida que escribes las medidas.',
      cardSkew: 'Sesgo (skew)', cardSize: 'Dimensión', cardWall: 'Desfase de pared',
      skewLine: '{long} es la diagonal larga: {mm} mm fuera de escuadra por cada 100 mm.',
      skewNone: 'Los ejes X e Y están a escuadra.',
      skewWhat: 'Es una propiedad de la máquina. Es igual para todos los filamentos.',
      sizeLine: '{mm} mm en {width} mm.',
      sizeWhat_shrinkage: 'Más pequeña que el modelo, dentro de lo que el {material} se contrae al enfriarse. Depende del filamento.',
      sizeWhat_beyondShrinkage: 'Más pequeña que el modelo, por encima de lo que el {material} suele contraerse (un {max} %).',
      sizeWhat_oversize: 'Más grande que el modelo. La contracción no puede causar eso.',
      sizeWhat_none: 'La dimensión es correcta.',
      wallLine_pos: 'Las paredes salen más gruesas que el diseño: las medidas exteriores dan {mm} mm de más y las interiores {mm} mm de menos.',
      wallLine_neg: 'Las paredes salen más finas que el diseño: las medidas exteriores dan {mm} mm de menos y las interiores {mm} mm de más.',
      wallWhat: 'Es un error constante, igual a 40 mm que a 180 mm. No se corrige escalando.',
      wallNone: 'Mide filas exteriores e interiores para verlo.',
      st_ok: 'En la meta', st_noise: 'Dentro del ruido de medida', st_adjust: 'Conviene corregir', st_none: 'Sin datos',
      actionsTitle: 'Qué cambiar',
      actionsLead: 'En este orden. El sesgo es de la impresora y se ajusta una sola vez. La dimensión es de cada filamento.',
      stepSkewTitle: 'A. Sesgo — una vez por impresora',
      skew_none: 'Introduce las diagonales para obtenerlo.',
      skew_ok: 'Nada que hacer: el sesgo está en la meta.',
      skew_noise: 'Nada que hacer: el sesgo es menor de lo que tus medidas pueden distinguir. Corregirlo sería perseguir ruido.',
      skew_adjust: 'Corrige {deg}° de sesgo. Si puedes, haz esta medida con un filamento que contraiga poco, como PLA.',
      skewIterate: '¿Ya había corrección de sesgo activa cuando imprimiste esta pieza?',
      skewIterateHint: 'Entonces escribe las tres longitudes que estaban cargadas (del SET_SKEW, o del perfil [skew_correction] en printer.cfg). Los valores nuevos se sumarán a esos en vez de reemplazarlos.',
      skewIterateOut: 'Corrección anterior {prev}° → nuevo total {total}°.',
      klipperSkewHow: 'printer.cfg necesita una sección [skew_correction]. Luego ejecuta en la consola:',
      klipperSkewLoad: 'Carga el perfil en tu macro PRINT_START, después del homing:',
      marlinSkewHow: 'Requiere SKEW_CORRECTION activado en Configuration.h. Supone que no había factor de sesgo al imprimir. Ejecuta:',
      stepSizeTitle: 'B. Dimensión — por filamento',
      size_none: 'Introduce medidas en X e Y para obtenerlo.',
      size_ok: 'Nada que hacer: la dimensión está en la meta con este filamento.',
      size_noise: 'Nada que hacer: el error de dimensión es menor de lo que tus medidas pueden distinguir.',
      size_shrinkage: 'La pieza sale un {pct} % pequeña, que es la contracción normal del {material}. Ponlo en el perfil del filamento en tu slicer. No toques el firmware: la impresora no está mal, el plástico se encogió.',
      size_beyondShrinkage: 'La pieza sale un {pct} % pequeña, más de lo que el {material} suele contraerse. Descarta primero un error de tecleo o un modelo escalado. Si mediste dos veces, un valor de contracción en el slicer igual corrige el resultado para este filamento; cambia el firmware solo si todos los filamentos muestran el mismo error.',
      size_oversize: 'La pieza sale un {pct} % grande. Revisa que no haya ya una compensación de contracción demasiado alta en el slicer. Si no, los pasos de la impresora están mal: corrige el firmware.',
      size_differ: 'X e Y difieren en {diff} %. El plástico se contrae más o menos igual en ambas direcciones, así que esa parte es mecánica: en CoreXY revisa que las dos correas tengan la misma tensión; en cartesiana corrige cada eje en el firmware.',
      oneNotBoth: 'Usa una de las dos opciones de abajo, nunca ambas: cada una aplica la corrección completa.',
      optSlicer: 'Opción 1 · Contracción en el slicer', optFirmware: 'Opción 2 · Pasos en el firmware', recommended: 'recomendada',
      slicer: 'Slicer', slicerOther: 'Otro (escalar el modelo)', currentValue: 'Valor usado en esta impresión',
      cur_orca: 'Vacío = 100 % (sin compensación).', cur_prusa: 'Vacío = 0 % (sin compensación).', cur_cura: 'Vacío = 100 % (sin compensación).', cur_scale: 'Vacío = 100 % (sin escalar).',
      shrinkLabel_orca: 'Pon Shrinkage (XY) en', shrinkLabel_prusa: 'Pon Shrinkage compensation XY en', shrinkLabel_cura: 'Pon Scaling Factor Shrinkage Compensation en', shrinkLabel_scale: 'Escala cada modelo en X e Y a',
      where_orca: 'Ajustes de filamento → Filamento → Shrinkage (XY). Esta pieza no dice nada sobre Z; deja Shrinkage (Z) como está.',
      where_prusa: 'Ajustes de filamento → Avanzado → Shrinkage compensation → XY.',
      where_cura: 'Busca "shrinkage" en los ajustes. Cura pide cuánto agrandar, por eso el valor es mayor que 100.',
      where_scale: 'Hay que aplicarlo a cada modelo que lamines con este filamento.',
      firmwareWarn: 'Solo si el error es el mismo con todos los filamentos. En una impresora de correas rotation_distance lo fija la polea (20 dientes × 2 mm = 40) y no debería necesitar ajuste.',
      stepsX: 'Pasos/mm actuales en X (M92)', stepsY: 'Pasos/mm actuales en Y (M92)',
      corexyNote: '# CoreXY: los dos motores mueven ambos ejes, así que X e Y comparten valor',
      stepFlowTitle: 'C. Desfase de pared — es flujo, no escala',
      flow_none: 'Mide filas exteriores e interiores para saber si las paredes salen gruesas o finas.',
      flow_ok: 'Nada que hacer: las medidas exteriores e interiores coinciden.',
      flow_noise: 'Nada que hacer: la diferencia entre exteriores e interiores está dentro del ruido de medida.',
      flow_pos: 'Las paredes son unos {mm} mm más gruesas en total. Es sobreextrusión o el aplastamiento de la primera capa: calibra el flujo (extrusion multiplier) o usa la compensación XY de contornos/agujeros del slicer. El resultado de dimensión de arriba ya descuenta este efecto.',
      flow_neg: 'Las paredes son unos {mm} mm más finas en total. Es subextrusión: calibra el flujo (extrusion multiplier). El resultado de dimensión de arriba ya descuenta este efecto.',
      stepAgainTitle: 'D. Vuelve a imprimir y comprueba',
      stepAgainText: 'Imprime otro Calistar con los ajustes nuevos y mídelo en una sesión nueva. Rellena los valores que estaban activos en esa impresión (contracción, AC/BD/AD) para que la siguiente corrección parta de ellos. Detente cuando todo diga "En la meta" o "Dentro del ruido de medida".',
      footer: 'Calistar es libre y de código abierto (GPL-3). Las medidas se guardan solo en este navegador.', wikiMeasuring: 'Consejos para medir',
      copy: 'Copiar', copied: 'Copiado',
    },
  };

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */
  const blank = () => ({
    model: '120x3', width: 120, points: 3, scale: 1, caliper: 0.02, tolerance: 0.05,
    material: 'PLA', firmware: 'klipper', kinematics: 'corexy', slicer: 'orca',
    curShrink: '', rotX: '', rotY: '', stepsX: '', stepsY: '', oldAC: '', oldBD: '', oldAD: '',
    meas: {},
  });
  let store = { lang: null, theme: null, current: 'PLA', sessions: { PLA: blank() } };
  let active = null; // row id shown in the diagram

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE));
      if (raw && raw.sessions && Object.keys(raw.sessions).length) {
        store = raw;
        for (const k in store.sessions) store.sessions[k] = Object.assign(blank(), store.sessions[k]);
        if (!store.sessions[store.current]) store.current = Object.keys(store.sessions)[0];
      }
    } catch (e) { /* private window or blocked storage: work without it */ }
    if (!store.lang) store.lang = (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* see load() */ }
  }
  const S = () => store.sessions[store.current];

  function t(key, vars) {
    let s = (TEXT[store.lang] && TEXT[store.lang][key]) || TEXT.en[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  const num = (v) => {
    const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };
  const fx = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  const signed = (v, d) => (Number.isFinite(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) : '—');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ------------------------------------------------------------------ */
  /* Diagram: the same geometry calistar.py builds, drawn flat           */
  /* ------------------------------------------------------------------ */
  const T = 4, DIAG = 15, PA = 0.8;

  function partRects(W, M) {
    const sep = W / (2 * M), half = W / 2;
    const v = (x, y0, y1) => ({ x: x - T / 2, y: Math.min(y0, y1), w: T, h: Math.abs(y1 - y0) });
    const h = (x0, x1, y) => ({ x: Math.min(x0, x1), y: y - T / 2, w: Math.abs(x1 - x0), h: T });
    const flip = (r) => ({ x: r.y, y: r.x, w: r.h, h: r.w });                 // mirror in y = x
    const turn = (r) => ({ x: r.y, y: -r.x - r.w, w: r.h, h: r.w });          // rotate -90 deg

    const frame = [
      v(0, -half - T, half + T),
      v(-sep + T / 2, sep - T, half), v(-sep + T / 2, -sep + T, -half),
      v(sep - T / 2, sep - T, half + T), v(sep - T / 2, 0, -half - T),
    ];
    const stops = [];
    for (let i = 1; i <= M; i++) {
      frame.push(v(-i * sep + T / 2, -sep, 0), v(-i * sep - T / 2, -T, sep));
      frame.push(v(i * sep + T / 2, -T, sep), v(i * sep - T / 2, -sep, 0));
      stops.push(h(i * sep - (T * 2) / 3 - PA * 2, i * sep + T / 2, sep / 2 + T / 4));
      stops.push(h(-i * sep + (T * 2) / 3 + 2 * PA, -i * sep - T / 2, sep / 2 - (3 * T) / 4));
    }
    const main = frame.concat(frame.map(flip), stops, stops.map(turn));

    let arm = [v(0, 0, half + T), v(-DIAG, 0, half)];
    for (let i = 2; i <= M; i++) arm.push(h(-DIAG, 0, i * sep - T / 2));
    arm = arm.concat(arm.map((r) => ({ x: r.x, y: -r.y - r.h, w: r.w, h: r.h })));
    const diag = arm.concat(arm.map((r) => ({ x: -r.y - r.h, y: r.x, w: r.h, h: r.w }))); // + rotate 90 deg
    return { main: main, diag: diag, sep: sep };
  }

  /** The two faces a row is measured between, in part coordinates (y up). */
  function rowPoints(row, W, M) {
    const sep = W / (2 * M);
    const j = M - row.loc + 1;
    const r = j * sep;
    const c = Math.SQRT1_2;
    switch (row.group) {
      case 'xo': return [[-r, -sep / 2], [r, -sep / 2]];
      case 'xi': return [[-r, sep * 0.8], [r, sep * 0.8]];
      case 'yo': return [[-sep / 2, -r], [-sep / 2, r]];
      case 'yi': return [[sep * 0.8, -r], [sep * 0.8, r]];
      case 'D': { const o = DIAG / 2; return [[(-r + o) * c, (-r - o) * c], [(r + o) * c, (r - o) * c]]; }
      default: { const o = DIAG / 2; return [[(r - o) * c, (-r - o) * c], [(-r - o) * c, (r - o) * c]]; }
    }
  }

  function drawDiagram() {
    const s = S(), W = s.width, M = s.points;
    if (!(W > 0)) { $('diagram').innerHTML = ''; return; }
    const g = partRects(W, M), sep = g.sep, half = W / 2;
    const R = half + T + 12;
    const rect = (r) => `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.w.toFixed(2)}" height="${r.h.toFixed(2)}"/>`;
    const a = half + T + 1, b = sep;
    const cross = `M${-b},${-a}H${b}V${-b}H${a}V${b}H${b}V${a}H${-b}V${b}H${-a}V${-b}H${-b}Z`;
    const rc = sep / 3;

    let mark = '';
    const row = active && C.layout(W, M, 1).find((x) => x.id === active);
    if (row) {
      const [p1, p2] = rowPoints(row, W, M);
      const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      const P = (p, along, across) => `${(p[0] + ux * along + nx * across).toFixed(2)},${(-(p[1] + uy * along + ny * across)).toFixed(2)}`;
      const out = row.kind === 'outer' ? 1 : -1;      // which side of the face the jaw sits on
      const jaw = (p, dir) => {
        const k = dir * out;
        return `<path class="hl ${row.kind}" d="M${P(p, 0, -6)}L${P(p, 0, 6)}M${P(p, k * 9, 0)}L${P(p, k * 1.2, 0)}M${P(p, k * 4, -2.4)}L${P(p, k * 1.2, 0)}L${P(p, k * 4, 2.4)}"/>`;
      };
      const mid = [(p1[0] + p2[0]) / 2 + nx * 9, (p1[1] + p2[1]) / 2 + ny * 9];
      mark =
        `<path class="hl ${row.kind}" stroke-dasharray="2 3" d="M${P(p1, 0, 0)}L${P(p2, 0, 0)}"/>` +
        jaw(p1, -1) + jaw(p2, 1) +
        `<text class="hl-label" text-anchor="middle" dominant-baseline="middle" x="${mid[0].toFixed(1)}" y="${(-mid[1]).toFixed(1)}">${rowName(row)}</text>`;
    }

    $('diagram').innerHTML =
      `<svg viewBox="${-R} ${-R} ${2 * R} ${2 * R}" role="img" aria-label="Calistar ${W}x${M}">` +
      `<defs><clipPath id="arms"><path clip-rule="evenodd" d="M${-2 * R},${-2 * R}H${2 * R}V${2 * R}H${-2 * R}Z${cross}"/></clipPath></defs>` +
      `<g transform="scale(1,-1)" class="part">` +
      `<g clip-path="url(#arms)"><g transform="rotate(45)">${g.diag.map(rect).join('')}</g></g>` +
      g.main.map(rect).join('') +
      `<path d="M0,0L0,${rc}A${rc},${rc} 0 1 1 ${rc},0Z"/>` +
      `</g>` +
      `<text class="axis-label" x="${R - 3}" y="-3" text-anchor="end">X →</text>` +
      `<text class="axis-label" x="3" y="${-R + 8}">Y ↑</text>` +
      mark + `</svg>`;

    $('diagramCaption').innerHTML = row
      ? t('capRow', { name: groupName(row.group) + ' ' + row.loc, nominal: fx(row.nominal, 2).replace(/\.?0+$/, ''), how: t(row.kind === 'outer' ? 'howOuter' : 'howInner') })
      : t('capIdle');
  }

  const groupName = (g) => t('g_' + g);
  const rowName = (row) => (row.axis === 'x' ? 'X' : row.axis === 'y' ? 'Y' : row.axis) + row.loc;

  /* ------------------------------------------------------------------ */
  /* Measurement table                                                  */
  /* ------------------------------------------------------------------ */
  function buildGroups() {
    const s = S();
    const rows = C.layout(s.width, s.points, s.scale);
    let html = '';
    for (const g of C.GROUPS) {
      const mine = rows.filter((r) => r.group === g.id);
      if (!mine.length) continue;
      const kind = g.axis === 'x' || g.axis === 'y' ? g.kind : 'outer';
      html += `<div class="group ${kind}"><header><b>${groupName(g.id)}</b><span>${t('gh_' + g.axis)}</span></header><div class="rows">` +
        `<span class="head"></span><span class="head">${t('colNominal')}</span><span class="head">1</span><span class="head">2</span><span class="head">3</span><span class="head devhead">${t('colDev')}</span>`;
      for (const r of mine) {
        const vals = s.meas[r.id] || [];
        html += `<span class="name" id="n-${r.id}">${rowName(r)}</span><span class="nominal">${fx(r.nominal, 2).replace(/\.?0+$/, '')}</span>`;
        for (let k = 0; k < 3; k++) {
          html += `<input type="text" inputmode="decimal" autocomplete="off" data-row="${r.id}" data-k="${k}" value="${esc(vals[k] == null ? '' : vals[k])}" aria-label="${groupName(g.id)} ${r.loc}, ${k + 1}">`;
        }
        html += `<span class="dev" id="dev-${r.id}"></span>`;
      }
      html += '</div></div>';
    }
    $('groups').innerHTML = html;
  }

  function readMeasurements() {
    const s = S(), out = {};
    for (const id in s.meas) out[id] = (s.meas[id] || []).map(num);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Results                                                            */
  /* ------------------------------------------------------------------ */
  const ICON = { ok: '✓', noise: '≈', adjust: '!', none: '–' };
  const pill = (status) => `<span class="pill ${status}">${ICON[status]} ${t('st_' + status)}</span>`;

  /** One or more values on a shared axis: target band, value dot, 2-sigma whisker. */
  function gauge(items, tol, unit, digits) {
    const reach = Math.max(3 * tol, ...items.map((i) => Math.abs(i.value) + 2 * i.sigma)) * 1.15;
    const w = 320, pad = 26, rowH = 22, top = 6, h = top + rowH * items.length + 16;
    const X = (v) => pad + ((v + reach) / (2 * reach)) * (w - 2 * pad);
    let s = `<svg class="gauge" viewBox="0 0 ${w} ${h}" role="img">` +
      `<rect class="band" x="${X(-tol)}" y="${top}" width="${X(tol) - X(-tol)}" height="${rowH * items.length}" rx="3"/>` +
      `<line class="zero" x1="${X(0)}" x2="${X(0)}" y1="${top - 2}" y2="${top + rowH * items.length + 2}"/>`;
    items.forEach((it, i) => {
      const y = top + rowH * i + rowH / 2;
      const tip = `${it.label ? it.label + ': ' : ''}${signed(it.value, digits)} ${unit} (±${fx(2 * it.sigma, digits)})`;
      s += `<g><title>${tip}</title><line class="track" x1="${pad}" x2="${w - pad}" y1="${y}" y2="${y}"/>` +
        `<line class="whisker" x1="${X(it.value - 2 * it.sigma)}" x2="${X(it.value + 2 * it.sigma)}" y1="${y}" y2="${y}"/>` +
        `<circle class="dot" cx="${X(it.value)}" cy="${y}" r="5"/>` +
        (it.label ? `<text class="rowlabel" x="4" y="${y + 3.5}">${it.label}</text>` : '') + `</g>`;
    });
    const by = h - 3;
    s += `<text x="${pad}" y="${by}" text-anchor="middle">${signed(-reach, digits)}</text>` +
      `<text x="${X(0)}" y="${by}" text-anchor="middle">0 ${unit}</text>` +
      `<text x="${w - pad}" y="${by}" text-anchor="middle">${signed(reach, digits)}</text></svg>`;
    return s;
  }

  function renderResults(a, v) {
    const s = S();
    $('resultsLead').textContent = t('resultsLead', { tol: fx(s.tolerance, 2), pct: fx(v.tolerancePercent, 2), deg: fx(v.toleranceDegrees, 3) });
    if (!a.x && !a.y && !a.skew) { $('cards').innerHTML = `<p class="muted">${t('resultsEmpty')}</p>`; return; }
    let html = '';

    // Skew
    html += `<div class="card"><h3>${t('cardSkew')} ${pill(a.skew ? v.skew.status : 'none')}</h3>`;
    if (a.skew) {
      const k = a.skew;
      html += `<div class="big">${signed(k.degrees, 3)}° <small>± ${fx(2 * k.sigma, 3)}</small></div>` +
        gauge([{ value: k.degrees, sigma: k.sigma }], v.toleranceDegrees, '°', 2) +
        `<p>${v.skew.status === 'ok' && Math.abs(k.degrees) < 1e-4 ? t('skewNone') : t('skewLine', { long: k.degrees < 0 ? 'D' : 'd', mm: fx(k.mmPer100, 2) })}</p><p>${t('skewWhat')}</p>`;
    } else html += `<p>${t('w_needDiagonals')}</p>`;
    html += '</div>';

    // Size
    html += `<div class="card"><h3>${t('cardSize')} ${pill(v.xy ? worst(v.x, v.y, v.xy) : 'none')}</h3>`;
    if (a.x || a.y) {
      const items = [];
      html += '<div class="pair">';
      for (const ax of ['x', 'y']) {
        if (!a[ax]) continue;
        items.push({ label: ax.toUpperCase(), value: v[ax].percent, sigma: v[ax].sigma });
        html += `<div><div class="axis">${ax.toUpperCase()}</div><div class="big">${signed(v[ax].percent, 2)} % <small>± ${fx(2 * v[ax].sigma, 2)}</small></div>` +
          `<p>${t('sizeLine', { mm: signed(a[ax].error * s.width, 2), width: s.width })}</p></div>`;
      }
      html += '</div>' + gauge(items, v.tolerancePercent, '%', 2) +
        `<p>${t('sizeWhat_' + v.xy.cause, { material: s.material, max: v.maxShrinkage })}</p>`;
    } else html += `<p>${t('size_none')}</p>`;
    html += '</div>';

    // Wall offset
    html += `<div class="card"><h3>${t('cardWall')} ${pill(v.offset ? v.offset.status : 'none')}</h3>`;
    if (v.offset) {
      const o = a.xy.offset, sg = a.xy.offsetSigma;
      html += `<div class="big">${signed(o, 2)} mm <small>± ${fx(2 * sg, 2)}</small></div>` +
        gauge([{ value: o, sigma: sg }], 0.05, 'mm', 2) +
        `<p>${t(o >= 0 ? 'wallLine_pos' : 'wallLine_neg', { mm: fx(Math.abs(o), 2) })}</p><p>${t('wallWhat')}</p>`;
    } else html += `<p>${t('wallNone')}</p>`;
    html += '</div>';

    $('cards').innerHTML = html;
  }

  function worst() {
    const order = ['ok', 'noise', 'adjust'];
    let w = 0;
    for (const x of arguments) if (x) w = Math.max(w, order.indexOf(x.status));
    return order[w];
  }

  function renderRows(a) {
    const span = Math.max(0.2, ...a.rows.filter((r) => r.n).map((r) => Math.abs(r.deviation)));
    for (const r of a.rows) {
      const el = $('dev-' + r.id);
      if (!el) continue;
      if (!r.n) { el.innerHTML = ''; continue; }
      const half = 34, len = Math.min(half, (Math.abs(r.deviation) / span) * half);
      const x = r.deviation < 0 ? 35 - len : 35;
      el.innerHTML = `<svg viewBox="0 0 70 14" aria-hidden="true"><rect class="bar" x="${x.toFixed(1)}" y="3" width="${Math.max(1, len).toFixed(1)}" height="8" rx="2"/><line class="zero" x1="35" x2="35" y1="0" y2="14"/></svg>` +
        `<span>${signed(r.deviation, 2)} mm</span>` + (r.suspect ? '<span class="warnmark" title="?">⚠</span>' : '');
    }
  }

  function renderNotes(a) {
    const msgs = [];
    for (const w of a.warnings) {
      const [code, axis] = w.split(':');
      msgs.push(t('w_' + code, { axis: (axis || '').toUpperCase() }));
    }
    $('measureNotes').innerHTML = msgs.length
      ? msgs.map((m) => `<p>${m}</p>`).join('')
      : `<p class="fine">✓ ${t('w_fine')}</p>`;
  }

  /* ------------------------------------------------------------------ */
  /* What to change                                                     */
  /* ------------------------------------------------------------------ */
  function setCode(id, text) {
    const el = $(id);
    el.textContent = text;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t('copy');
    b.addEventListener('click', () => {
      const done = () => { b.textContent = t('copied'); setTimeout(() => (b.textContent = t('copy')), 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => {});
    });
    el.appendChild(b);
  }

  function renderActions(a, v) {
    const s = S();
    document.querySelectorAll('[data-fw]').forEach((el) => (el.hidden = el.dataset.fw !== s.firmware));

    // A. skew
    const sk = a.skew ? v.skew.status : 'none';
    $('stepSkewText').textContent = t('skew_' + sk, { deg: a.skew ? fx(Math.abs(a.skew.degrees), 3) : '' });
    $('skewFix').hidden = sk !== 'adjust';
    if (a.skew) {
      const k = C.klipperSkew(a.skew.degrees, { ac: num(s.oldAC), bd: num(s.oldBD), ad: num(s.oldAD) });
      setCode('klipperSkewCode', `SET_SKEW XY=${k.ac.toFixed(4)},${k.bd.toFixed(4)},${k.ad.toFixed(4)}\nSKEW_PROFILE SAVE=calistar\nSAVE_CONFIG`);
      $('skewIterateOut').textContent = k.previousDegrees ? t('skewIterateOut', { prev: signed(k.previousDegrees, 3), total: signed(k.totalDegrees, 3) }) : '';
      setCode('marlinSkewCode', `M852 I${C.marlinSkewFactor(a.skew.degrees).toFixed(6)}\nM500`);
    }

    // B. size
    const xy = v.xy;
    const key = !xy ? 'none' : xy.status !== 'adjust' ? xy.status : xy.cause;
    $('stepSizeText').textContent = t('size_' + key, { pct: xy ? fx(Math.abs(xy.percent), 2) : '', material: s.material });
    const differ = $('stepSizeDiffer');
    differ.hidden = !v.axesDiffer;
    if (v.axesDiffer) differ.textContent = t('size_differ', { diff: fx(Math.abs(v.x.percent - v.y.percent), 2) });
    const showFix = !!xy && (xy.status === 'adjust' || v.axesDiffer || (v.x && v.x.status === 'adjust') || (v.y && v.y.status === 'adjust'));
    $('sizeFix').hidden = !showFix;
    if (a.xy) {
      const firmwareFirst = xy.cause === 'oversize';
      $('tagSlicer').hidden = firmwareFirst;
      $('tagFirmware').hidden = !firmwareFirst;
      $('optFirmware').classList.toggle('dim', !firmwareFirst);

      $('curShrink').placeholder = s.slicer === 'prusa' ? '0' : '100';
      $('curShrinkHint').textContent = t('cur_' + s.slicer);
      $('shrinkLabel').textContent = t('shrinkLabel_' + s.slicer);
      $('shrinkOut').textContent = C.shrinkage(s.slicer, num(s.curShrink), a.xy.scale).toFixed(s.slicer === 'prusa' ? 3 : 2) + ' %';
      $('shrinkWhere').textContent = t('where_' + s.slicer);

      const core = s.kinematics === 'corexy';
      const sx = core || !a.x ? a.xy.scale : a.x.scale;
      const sy = core || !a.y ? a.xy.scale : a.y.scale;
      const rx = num(s.rotX) > 0 ? num(s.rotX) : 40, ry = num(s.rotY) > 0 ? num(s.rotY) : 40;
      setCode('klipperRotCode',
        (core ? t('corexyNote') + '\n' : '') +
        `[stepper_x]\nrotation_distance: ${C.rotationDistance(rx, sx).toFixed(4)}\n\n[stepper_y]\nrotation_distance: ${C.rotationDistance(ry, sy).toFixed(4)}`);
      const mx = num(s.stepsX) > 0 ? num(s.stepsX) : 80, my = num(s.stepsY) > 0 ? num(s.stepsY) : 80;
      setCode('marlinStepsCode', `M92 X${C.stepsPerMm(mx, sx).toFixed(3)} Y${C.stepsPerMm(my, sy).toFixed(3)}\nM500`);
    }

    // C. flow
    let fk = 'none', mm = '';
    if (v.offset) {
      fk = v.offset.status !== 'adjust' ? v.offset.status : a.xy.offset > 0 ? 'pos' : 'neg';
      mm = fx(Math.abs(2 * a.xy.offset), 2);
    }
    $('stepFlowText').textContent = t('flow_' + fk, { mm: mm });
  }

  /* ------------------------------------------------------------------ */
  /* Wiring                                                             */
  /* ------------------------------------------------------------------ */
  function compute() {
    const s = S();
    const a = C.analyze({ width: s.width, points: s.points, scale: s.scale, caliperError: s.caliper, measurements: readMeasurements() });
    const v = C.assess(a, { material: s.material, tolerance: s.tolerance });
    renderRows(a); renderNotes(a); renderResults(a, v); renderActions(a, v);
    return { analysis: a, verdict: v };
  }

  function applyStatic() {
    document.documentElement.lang = store.lang;
    if (store.theme) document.documentElement.dataset.theme = store.theme; else delete document.documentElement.dataset.theme;
    document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $('langBtn').textContent = store.lang === 'es' ? 'English' : 'Español';

    const s = S();
    $('model').innerHTML = MODELS.map((m) => `<option value="${m}">calistar_${m}</option>`).join('') + `<option value="custom">${t('modelCustom')}</option>`;
    $('model').value = s.model;
    document.querySelectorAll('.custom').forEach((el) => (el.hidden = s.model !== 'custom'));
    $('material').innerHTML = Object.keys(C.MATERIALS).map((m) => `<option>${m}</option>`).join('');
    const max = C.MATERIALS[s.material];
    $('materialHint').textContent = max === null || max === undefined ? t('materialOther') : t('materialHint', { max: max, name: s.material });

    for (const id of ['width', 'points', 'material', 'firmware', 'kinematics', 'slicer', 'curShrink', 'rotX', 'rotY', 'stepsX', 'stepsY', 'oldAC', 'oldBD', 'oldAD']) $(id).value = s[id];
    $('caliper').value = s.caliper; $('printScale').value = s.scale; $('tolerance').value = s.tolerance;

    const sel = $('session');
    sel.innerHTML = '';
    for (const name of Object.keys(store.sessions)) {
      const o = document.createElement('option');
      o.value = o.textContent = name;
      sel.appendChild(o);
    }
    sel.value = store.current;
  }

  function refresh(full) {
    if (full) { applyStatic(); buildGroups(); }
    drawDiagram();
    compute();
    save();
  }

  function onSetupChange(e) {
    const s = S(), id = e.target.id;
    if (id === 'model') {
      s.model = e.target.value;
      if (s.model !== 'custom') { const [w, p] = s.model.split('x').map(Number); s.width = w; s.points = p; }
    } else if (id === 'width') { const w = num(e.target.value); if (w > 0) s.width = w; }
    else if (id === 'points') s.points = Number(e.target.value);
    else if (id === 'caliper') { const c = num(e.target.value); if (c > 0) s.caliper = c; }
    else if (id === 'printScale') { const c = num(e.target.value); if (c > 0) s.scale = c; }
    else if (id === 'tolerance') { const c = num(e.target.value); if (c > 0) s.tolerance = c; }
    else s[id] = e.target.value;
    active = null;
    refresh(true);
  }

  function init() {
    load();
    refresh(true);

    for (const id of ['model', 'width', 'points', 'material', 'firmware', 'kinematics', 'caliper', 'printScale', 'tolerance']) $(id).addEventListener('change', onSetupChange);
    for (const id of ['slicer', 'curShrink', 'rotX', 'rotY', 'stepsX', 'stepsY', 'oldAC', 'oldBD', 'oldAD']) {
      $(id).addEventListener('input', (e) => { S()[id] = e.target.value; compute(); save(); });
    }

    const groups = $('groups');
    groups.addEventListener('input', (e) => {
      const d = e.target.dataset;
      if (!d.row) return;
      const s = S();
      (s.meas[d.row] = s.meas[d.row] || ['', '', ''])[Number(d.k)] = e.target.value;
      compute(); save();
    });
    groups.addEventListener('focusin', (e) => {
      if (!e.target.dataset.row) return;
      active = e.target.dataset.row;
      groups.querySelectorAll('.row-active').forEach((el) => el.classList.remove('row-active'));
      const n = $('n-' + active); if (n) n.classList.add('row-active');
      drawDiagram();
    });
    groups.addEventListener('keydown', (e) => {
      if (!e.target.dataset.row || !['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const col = Array.from(groups.querySelectorAll(`input[data-k="${e.target.dataset.k}"]`));
      const next = col[col.indexOf(e.target) + (e.key === 'ArrowUp' ? -1 : 1)];
      if (next) { e.preventDefault(); next.focus(); next.select(); }
    });

    $('clearBtn').addEventListener('click', () => { if (confirm(t('clearConfirm'))) { S().meas = {}; refresh(true); } });
    $('langBtn').addEventListener('click', () => { store.lang = store.lang === 'es' ? 'en' : 'es'; refresh(true); });
    $('themeBtn').addEventListener('click', () => {
      const dark = store.theme ? store.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      store.theme = dark ? 'light' : 'dark';
      refresh(true);
    });

    $('session').addEventListener('change', (e) => { store.current = e.target.value; active = null; refresh(true); });
    $('sessionNew').addEventListener('click', () => {
      const name = (prompt(t('sessionPrompt')) || '').trim();
      if (!name) return;
      if (!store.sessions[name]) {
        // Keep the printer, start with clean measurements.
        store.sessions[name] = Object.assign(blank(), S(), { meas: {}, curShrink: '' });
        if (C.MATERIALS[name.split(' ')[0].toUpperCase()] !== undefined) store.sessions[name].material = name.split(' ')[0].toUpperCase();
      }
      store.current = name; active = null; refresh(true);
    });
    $('sessionDelete').addEventListener('click', () => {
      if (!confirm(t('sessionDeleteConfirm', { name: store.current }))) return;
      delete store.sessions[store.current];
      if (!Object.keys(store.sessions).length) store.sessions.PLA = blank();
      store.current = Object.keys(store.sessions)[0]; active = null; refresh(true);
    });
    $('exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ calistarWorksheet: 1, sessions: store.sessions }, null, 2)], { type: 'application/json' });
      const aEl = document.createElement('a');
      aEl.href = URL.createObjectURL(blob);
      aEl.download = 'calistar-worksheet.json';
      aEl.click();
      setTimeout(() => URL.revokeObjectURL(aEl.href), 1000);
    });
    $('importBtn').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      file.text().then((txt) => {
        let data = null;
        try { data = JSON.parse(txt); } catch (err) { /* handled below */ }
        if (!data || !data.calistarWorksheet || typeof data.sessions !== 'object') { alert(t('importError')); return; }
        for (const k in data.sessions) store.sessions[k] = Object.assign(blank(), data.sessions[k]);
        store.current = Object.keys(data.sessions)[0] || store.current;
        active = null; refresh(true);
      });
      e.target.value = '';
    });
  }

  // Test hook: lets a script fill a session without touching the DOM.
  window.CalistarApp = { store: () => store, refresh: () => refresh(true), focusRow: (id) => { active = id; drawDiagram(); } };
  init();
  const m = /row=(\w+)/.exec(location.hash); if (m) { active = m[1]; drawDiagram(); }
})();
