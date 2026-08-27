/* ============================================================================
 * Dialectic — SpaceX thesis & valuation dashboard
 * charts-interactive.js — data + factories + engine
 *
 * Chart.js 4.4.4, vendored at assets/chart.umd.js. Never a CDN: the page must
 * render from file:// with no siblings.
 *
 * Every series below is extracted from
 *   Dialectic_SpaceX_Financial_Model_Q3_2026_v5_REVIEWED.xlsx
 * and carries a comment naming the sheet and range it came from.
 *
 * Units: the workbook stores most financials in $M. Chart series are converted
 * to $B (÷1000) because chart axes read better in billions — the conversion is
 * marked at each array. Operational series (launch counts, tonnes, subscribers,
 * GW) stay in native units. Metrics_Charts rows 14-23 are ALREADY $B in the
 * workbook and are NOT divided again.
 * Watch out: several workbook charts are titled "$Bn" but hold $M values.
 * Trust the magnitudes, not the title.
 * ==========================================================================*/
(function () {
  "use strict";

  const CHART_ENGINE_BUILD = "2026.08.26-7";

  // ===== YEAR AXES =====
  const Q3_YEARS_15 = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040];  // Metrics_Charts!C4:Q4 — 2026-2040
  const Q3_YEARS_20 = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045];  // Annex_G_Panels!C4:V4 — 2026-2045
  const Q3_YEARS_10 = Q3_YEARS_20.slice(0, 10);  // 2026–2035 — DOCX Annex C / G figure window + annex tables

  // ===== SUMMARY: EV BY HORIZON (Summary!G7:G10, $B native) =====
  const q3EvHorizonLabels = ["5-year", "10-year", "20-year", "Blended Fair Value "];
  // Summary!G7:G10 — implied EV, $B
  const q3EvHorizonData = [3031.484117, 4995.393636, 7954.979774, 4211.202014];  // n=4

  // ===== METRICS_CHARTS: PHYSICAL METRICS (native units) =====
  // Metrics_Charts!C5:Q5 — Falcon 9 launches (#)
  const q3Falcon9 = [162.8, 214.461689, 283.336824, 375.345354, 498.486087, 560.236726, 629.89303, 708.488308, 797.192785, 897.331914, 912.769914, 928.497954, 944.521647, 960.846719, 977.479004];  // n=15
  // Metrics_Charts!C6:Q6 — Starship launches (#)
  const q3Starship = [7, 30, 40.928552, 56.053893, 77.035383, 99.126784, 127.680938, 164.603063, 212.362727, 274.161645, 323.945908, 383.306954, 454.134687, 538.696075, 639.710736];  // n=15
  // Metrics_Charts!C7:Q7 — Mass to orbit (t)
  const q3MassToOrbit = [2391.52, 4088.786637, 6034.482019, 9167.03569, 14355.918718, 18174.879652, 23280.430061, 30155.417458, 39471.586489, 52164.657597, 61083.395832, 71980.148492, 85312.585131, 101645.672242, 121676.97655];  // n=15
  // Metrics_Charts!C8:Q8 — Starlink subscribers (M)
  const q3StarlinkSubs = [14.079272, 29.540449, 62.360998, 132.326315, 282.010843, 341.650394, 413.950393, 501.606141, 607.887996, 736.764288, 781.485114, 829.110816, 879.840908, 933.889238, 991.485052];  // n=15
  // Metrics_Charts!C9:Q9 — Colossus installed compute (GW)
  const q3ColossusGw = [2.085, 7.9, 11.2348, 15.982542, 22.743862, 28.729659, 36.335589, 46.008851, 58.321851, 74.007644, 82.740856, 92.554288, 103.585945, 115.991881, 129.948603];  // n=15

  // ===== METRICS_CHARTS: EXPECTED REVENUE BY SEGMENT (rows 14-22 already $B) =====
  // Metrics_Charts!C14:Q14 — Launch Services revenue ($B)
  const q3RevLaunchData = [14.545903, 23.049808, 31.753651, 43.935181, 61.042137, 72.790958, 87.206107, 104.986198, 127.032644, 154.512336, 168.200252, 184.498779, 212.718471, 237.116897, 266.252849];  // n=15
  // Metrics_Charts!C15:Q15 — Starlink revenue ($B)
  const q3RevStarlinkData = [18, 38.997155, 88.33547, 200.144621, 453.59, 511.948183, 577.841395, 652.245588, 736.263468, 831.141, 931.433393, 1043.867969, 1169.91904, 1311.240395, 1469.68719];  // n=15
  // Metrics_Charts!C16:Q16 — Starshield revenue ($B)
  const q3RevStarshieldData = [3.00067, 6.363469, 8.359056, 11.066039, 14.767299, 17.631763, 21.150683, 25.492122, 30.870487, 37.559812, 40.3432, 43.361233, 46.63531, 50.188867, 54.047575];  // n=15
  // Metrics_Charts!C17:Q17 — xAI revenue ($B)
  const q3RevXaiData = [22.099, 29.03299, 37.84491, 49.456402, 64.782193, 75.226731, 87.432372, 101.70471, 118.403478, 137.952288, 148.467267, 159.823261, 172.089903, 185.342737, 199.663731];  // n=15
  // Metrics_Charts!C18:Q18 — Terrestrial Data Centres revenue ($B)
  const q3RevTerrestrialData = [23.069, 105.06, 149.88492, 213.883478, 305.275645, 387.902431, 493.336345, 627.963008, 799.975405, 1019.889884, 1121.11564, 1232.926792, 1356.468582, 1493.013158, 1643.973889];  // n=15
  // Metrics_Charts!C19:Q19 — Orbital Data Centres revenue ($B)
  const q3RevOrbitalData = [0, 0, 0, 0, 0, 8.6, 14.3, 23.942, 40.3358, 68.34086, 94.340456, 130.656574, 181.52523, 252.968431, 353.562157];  // n=15
  // Metrics_Charts!C20:Q20 — X Platform revenue ($B)
  const q3RevXPlatformData = [1.49974, 1.683933, 1.901228, 2.158958, 2.466284, 2.686464, 2.933729, 3.211985, 3.525755, 3.880272, 4.066663, 4.263889, 4.472652, 4.693704, 4.927847];  // n=15
  // Metrics_Charts!C21:Q21 — Terafab revenue ($B)
  const q3RevTerafabData = [0, 0, 0, 0, 0, 4.5, 7.44375, 12.456563, 21.074391, 36.020876, 49.960907, 69.541339, 97.117799, 136.052264, 191.149976];  // n=15
  // Metrics_Charts!C22:Q22 — Deep Space Optionality revenue ($B)
  const q3RevDeepSpaceData = [0, 0, 0, 0, 0, 0.0235, 0.02745, 0.032325, 0.038379, 0.04594, 1.49, 2.3345, 3.700925, 5.922376, 9.547023];  // n=15
  // Metrics_Charts!C23:Q23 — Total revenue ($B)
  const q3RevTotalData = [82.214313, 204.187356, 318.079235, 520.64468, 901.923558, 1081.31003, 1291.67183, 1552.034499, 1877.519805, 2289.343268, 2559.417778, 2871.274337, 3244.647912, 3676.538829, 4192.812237];  // n=15

  // ===== ANNEX G / DCF: Figure C2 (workbook $M -> $B) =====
  // Annex_G_Panels!C5:V5 — Adjusted UFCF, $M/1000 = $B
  const q3AdjUfcfData = [-23.208524, -248.403701, -27.181333, 117.117293, 323.461982, 223.492019, 272.395366, 329.475805, 395.297838, 474.241816, 540.081101, 609.665786, 690.214038, 784.625274, 895.985778, 959.242996, 1030.815803, 1127.238424, 1259.455526, 1443.402726];  // n=20
  // Annex_G_Panels!C6:V6 — Total revenue, $M/1000 = $B
  const q3TotalRevData = [82.214313, 204.187356, 318.079235, 520.64468, 901.923558, 1081.31003, 1291.67183, 1552.034499, 1877.519805, 2289.343268, 2559.417778, 2871.274337, 3244.647912, 3676.538829, 4192.812237, 4480.182548, 4868.299182, 5399.267738, 6133.830234, 7159.856122];  // n=20

  // ===== ANNEX G: nine segment panels (Revenue / EBITDA / UFCF, $M -> $B) =====
  const Q3_SEGMENT_SERIES = {
  // Annex_G_Panels!C10:V12 — Launch Services
  launch: { label: "Launch Services",
    revenue: [14.545903, 23.049808, 31.753651, 43.935181, 61.042137, 72.790958, 87.206107, 104.986198, 127.032644, 154.512336, 168.200252, 184.498779, 212.718471, 237.116897, 266.252849, 289.323961, 315.649045, 345.701372, 380.026965, 419.256572],
    ebitda: [6.788255, 10.950671, 15.284509, 21.406009, 30.075686, 36.096502, 43.516366, 52.70685, 64.148267, 78.463472, 85.891837, 94.75529, 110.446006, 123.826802, 139.830626, 152.716502, 167.442636, 184.281057, 203.546344, 225.602779],
    ufcf: [0.254245, 0.680596, 3.295287, 8.86022, 15.356107, 7.741113, 9.540985, 11.800393, 14.649442, 18.258088, 20.287862, 22.732957, 25.682163, 29.243202, 33.546753, 36.825608, 40.553299, 44.791161, 49.60888, 55.085628] },
  // Annex_G_Panels!C15:V17 — Starlink
  starlink: { label: "Starlink",
    revenue: [18, 38.997155, 88.33547, 200.144621, 453.59, 511.948183, 577.841395, 652.245588, 736.263468, 831.141, 931.433393, 1043.867969, 1169.91904, 1311.240395, 1469.68719, 1517.809786, 1567.559107, 1618.991712, 1672.166175, 1727.143161],
    ebitda: [11.283073, 24.622287, 55.701123, 126.034124, 285.236099, 322.133991, 363.819438, 410.915291, 464.125626, 524.246357, 587.831536, 659.150619, 739.146627, 828.877823, 929.531816, 960.46872, 992.466435, 1025.562308, 1059.795029, 1095.204685],
    ufcf: [3.413628, 10.951607, 31.503887, 84.066958, 206.836518, 160.831555, 181.817321, 205.547213, 232.380738, 262.724587, 294.84284, 330.895496, 371.365382, 416.794672, 467.792193, 483.7615, 500.290379, 517.398899, 535.107862, 553.438833] },
  // Annex_G_Panels!C20:V22 — Starshield
  starshield: { label: "Starshield",
    revenue: [3.00067, 6.363469, 8.359056, 11.066039, 14.767299, 17.631763, 21.150683, 25.492122, 30.870487, 37.559812, 40.3432, 43.361233, 46.63531, 50.188867, 54.047575, 52.661497, 51.312482, 49.999505, 48.721574, 47.477721],
    ebitda: [1.25114, 2.700048, 3.611145, 4.86881, 6.617743, 8.006948, 9.73219, 11.882748, 14.572963, 17.949488, 19.366178, 20.906953, 22.583361, 24.40806, 26.394927, 25.696402, 25.017012, 24.35622, 23.713504, 23.088355],
    ufcf: [0.038401, 0.565538, 0.810305, 1.66136, 2.900517, 4.247037, 5.330169, 6.598369, 8.169975, 10.137066, 10.966022, 11.86903, 12.85305, 13.925714, 15.095394, 14.688736, 14.293362, 13.908952, 13.535195, 13.17179] },
  // Annex_G_Panels!C25:V27 — xAI
  xai: { label: "xAI",
    revenue: [22.099, 29.03299, 37.84491, 49.456402, 64.782193, 75.226731, 87.432372, 101.70471, 118.403478, 137.952288, 148.467267, 159.823261, 172.089903, 185.342737, 199.663731, 192.507728, 185.614171, 178.973254, 172.575541, 166.411956],
    ebitda: [10.90985, 14.545478, 19.212337, 25.421419, 33.692136, 39.41853, 46.147827, 54.059225, 63.364417, 74.313547, 80.285031, 86.753122, 93.760131, 101.352035, 109.5788, 105.511036, 101.596801, 97.830224, 94.20566, 90.717684],
    ufcf: [7.638781, 10.020928, 13.217746, 18.122921, 24.656787, 8.756157, 10.291275, 12.101962, 14.238435, 16.76016, 18.148498, 19.654996, 21.289893, 23.064326, 24.990412, 24.043535, 23.133005, 22.257412, 21.415402, 20.605674] },
  // Annex_G_Panels!C30:V32 — Terrestrial Data Centres
  terrestrialDc: { label: "Terrestrial Data Centres",
    revenue: [23.069, 105.06, 149.88492, 213.883478, 305.275645, 387.902431, 493.336345, 627.963008, 799.975405, 1019.889884, 1121.11564, 1232.926792, 1356.468582, 1493.013158, 1643.973889, 1642.533833, 1641.110003, 1639.702078, 1638.309746, 1636.9327],
    ebitda: [15.795125, 72.61125, 103.745666, 148.257499, 211.905147, 270.042454, 344.391429, 439.527544, 561.329813, 717.355009, 789.988364, 870.316754, 959.180434, 1057.513393, 1166.353974, 1165.4962, 1164.646593, 1163.804994, 1162.971246, 1162.145197],
    ufcf: [-37.469976, -263.002113, -62.052174, 20.818424, 90.021066, 38.27746, 50.261512, 65.905143, 86.313193, 112.922325, 126.576587, 141.833212, 158.87927, 177.923673, 199.19973, 199.280455, 199.357941, 199.432251, 199.503451, 199.571602] },
  // Annex_G_Panels!C35:V37 — Orbital Data Centres
  orbitalDc: { label: "Orbital Data Centres",
    revenue: [0, 0, 0, 0, 0, 8.6, 14.3, 23.942, 40.3358, 68.34086, 94.340456, 130.656574, 181.52523, 252.968431, 353.562157, 495.539276, 696.374946, 981.067491, 1385.422335, 1960.783411],
    ebitda: [0, 0, 0, 0, 0, 4.53, 7.653, 13.0053, 22.21833, 38.140293, 53.20706, 74.439958, 104.43257, 146.891838, 207.123071, 292.728423, 414.613485, 588.438781, 836.713955, 1191.82075],
    ufcf: [-0.4, -1.6, -6.4, -10.32, -13.68, -8.0493, -3.83793, 0.017562, 1.154469, 2.813848, 4.648841, 7.464208, 11.744304, 18.203763, 27.894685, 42.36311, 63.877254, 95.760207, 142.87461, 212.328385] },
  // Annex_G_Panels!C40:V42 — X Platform
  xPlatform: { label: "X Platform",
    revenue: [1.49974, 1.683933, 1.901228, 2.158958, 2.466284, 2.686464, 2.933729, 3.211985, 3.525755, 3.880272, 4.066663, 4.263889, 4.472652, 4.693704, 4.927847, 5.040704, 5.156453, 5.275171, 5.396935, 5.521829],
    ebitda: [0.273449, 0.314447, 0.363639, 0.422946, 0.494784, 0.546538, 0.60517, 0.671714, 0.747373, 0.833546, 0.878415, 0.926067, 0.976689, 1.030485, 1.087669, 1.114568, 1.14218, 1.170523, 1.19962, 1.229489],
    ufcf: [-0.038975, -0.006587, 0.032275, 0.079127, 0.135879, 0.203702, 0.258618, 0.302925, 0.347734, 0.39396, 0.417828, 0.443258, 0.470359, 0.49925, 0.530055, 0.544251, 0.558835, 0.573817, 0.589209, 0.605021] },
  // Annex_G_Panels!C45:V47 — Terafab
  terafab: { label: "Terafab",
    revenue: [0, 0, 0, 0, 0, 4.5, 7.44375, 12.456563, 21.074391, 36.020876, 49.960907, 69.541339, 97.117799, 136.052264, 191.149976, 269.288212, 380.321819, 538.388205, 763.78914, 1085.705802],
    ebitda: [0, 0, 0, 0, 0, 1.96875, 3.340313, 5.723016, 9.894654, 17.250247, 24.20191, 34.04914, 48.026728, 67.904896, 96.224209, 136.634391, 194.383267, 277.022684, 395.428127, 565.272027],
    ufcf: [-1.5, -7.5, -12.1875, -13.125, -13.875, -10.238437, -7.385841, -3.999802, 0.57394, 4.956491, 7.740637, 11.660128, 17.166857, 24.940462, 36.206498, 52.531816, 76.18647, 110.459528, 160.116797, 232.06426] },
  // Annex_G_Panels!C50:V52 — Deep Space Optionality
  deepSpace: { label: "Deep Space Optionality",
    revenue: [0, 0, 0, 0, 0, 0.0235, 0.02745, 0.032325, 0.038379, 0.04594, 1.49, 2.3345, 3.700925, 5.922376, 9.547023, 15.47755, 25.201156, 41.16895, 67.421823, 110.622969],
    ebitda: [0, 0, 0, 0, 0, 0.010525, 0.012698, 0.015436, 0.018901, 0.023304, 0.8735, 1.401875, 2.264844, 3.67783, 5.995788, 9.803783, 16.066407, 26.374289, 43.350787, 71.322971],
    ufcf: [0, 0, 0, -0.09, -0.18, -0.144685, -0.120019, -0.098348, -0.079029, -0.061457, 0.056893, 0.112085, 0.19884, 0.338162, 0.559393, 0.924494, 1.527618, 2.523705, 4.168473, 6.883934] },
  };

  // ===== SUM OF PARTS: SOTP by scenario (P39:S47, already $Bn) =====
  const q3SotpLabels = ["Starlink", "Terrestrial Data Centres", "Launch Services", "Starshield", "xAI", "Terafab", "Orbital Data Centres", "X Platform", "Deep Space Optionality"];
  // Sum of Parts!Q39:Q47 — Bear EV ($Bn)
  const q3SotpBear = [1201.313113, 185.421056, 55.067485, 29.443768, 48.140608, -12.021957, -5.198791, 1.361608, -1.244225];  // n=9
  // Sum of Parts!R39:R47 — Base EV ($Bn)
  const q3SotpBase = [3057.975311, 893.562749, 205.434905, 106.635746, 228.838162, -6.379245, -2.814009, 4.261435, -0.688831];  // n=9
  // Sum of Parts!S39:S47 — Bull EV ($Bn)
  const q3SotpBull = [4722.146198, 1965.838048, 451.95679, 234.598641, 503.443956, 1.275849, 0.562802, 9.375158, 0.137766];  // n=9

  // ===== SUM OF PARTS: cumulative build (U39:AA47, already $Bn) =====
  const q3CumLabels = ["Starlink", "Terrestrial Data Centres", "Launch Services", "Starshield", "xAI", "Terafab", "Orbital Data Centres", "X Platform", "Deep Space Optionality"];
  // Sum of Parts!W39:W47 — Cumulative Base ($Bn)
  const q3CumBase = [3057.975311, 3951.53806, 4156.972964, 4263.60871, 4492.446872, 4486.067627, 4483.253618, 4487.515053, 4486.826223];  // n=9
  // Sum of Parts!Y39:Y47 — Cumulative Bear ($Bn)
  const q3CumBear = [1201.313113, 1386.734169, 1441.801654, 1471.245422, 1519.38603, 1507.364073, 1502.165283, 1503.52689, 1502.282666];  // n=9
  // Sum of Parts!AA39:AA47 — Cumulative Bull ($Bn)
  const q3CumBull = [4722.146198, 6687.984246, 7139.941036, 7374.539677, 7877.983633, 7879.259482, 7879.822284, 7889.197442, 7889.335208];  // n=9

  // ===== SCENARIO PATHS (business-line tabs, $M -> $B) =====
  const Q3_SCENARIO_SERIES = {
  // Starlink!C30:V33 — Starlink revenue by scenario
  starlink: { label: "Starlink revenue",
    bear: [11.834829, 20.113292, 47.883154, 113.99409, 271.382552, 300.348677, 332.406513, 367.886055, 407.15252, 450.610107, 495.655507, 545.203887, 599.705388, 659.655151, 725.597814, 740.10977, 754.911965, 770.010205, 785.410409, 801.118617],
    base: [17.483887, 37.817647, 85.655305, 194.005495, 439.413907, 495.717651, 559.235805, 630.892776, 711.731423, 802.928227, 899.23502, 1007.093279, 1127.888539, 1263.172521, 1414.683067, 1457.123559, 1500.837266, 1545.862384, 1592.238255, 1640.005403],
    bull: [22.937775, 53.158293, 119.039257, 266.568843, 596.937093, 677.861162, 769.755743, 874.108057, 992.606944, 1127.170191, 1270.176221, 1431.325673, 1612.920435, 1817.554439, 2048.150712, 2130.076741, 2215.27981, 2303.891003, 2396.046643, 2491.888508],
    weighted: [18, 38.997155, 88.33547, 200.144621, 453.59, 511.948183, 577.841395, 652.245588, 736.263468, 831.141, 931.433393, 1043.867969, 1169.91904, 1311.240395, 1469.68719, 1517.809786, 1567.559107, 1618.991712, 1672.166175, 1727.143161] },
  // Starshield!C31:V34 — Starshield revenue by scenario
  starshield: { label: "Starshield revenue",
    bear: [1.904, 3.628852, 4.255998, 4.995787, 5.86899, 6.323462, 6.81384, 7.342983, 7.913979, 8.530162, 8.779089, 9.035415, 9.299359, 9.571151, 9.851025, 9.752514, 9.654989, 9.558439, 9.462855, 9.368226],
    base: [3.026, 6.109101, 7.588066, 9.430974, 11.728116, 13.248268, 14.969217, 16.917932, 19.125059, 21.625429, 22.564718, 23.545752, 24.570418, 25.640693, 26.758639, 26.223467, 25.698997, 25.185017, 24.681317, 24.187691],
    bull: [3.842, 8.900143, 12.735223, 18.300995, 26.402521, 33.261477, 42.003207, 53.162518, 67.429386, 85.694568, 93.499289, 102.041371, 111.392044, 121.629517, 132.839662, 129.079412, 125.427471, 121.88068, 118.435972, 115.09037],
    weighted: [3.1586, 6.698389, 8.799006, 11.648462, 15.544525, 18.55975, 22.263876, 26.833813, 32.495249, 39.536644, 42.466526, 45.643404, 49.0898, 52.830386, 56.892185, 55.433155, 54.013139, 52.631058, 51.285867, 49.976548] },
  // Terrestrial_DC!C31:V34 — Colossus revenue by scenario
  colossus: { label: "Colossus revenue",
    bear: [12.6, 54, 73.278, 99.438246, 134.9377, 155.178355, 178.455108, 205.223374, 236.00688, 271.407912, 279.278742, 287.377825, 295.711782, 304.287424, 313.111759, 306.849524, 300.712534, 294.698283, 288.804317, 283.028231],
    base: [26, 105, 148.995, 211.423905, 300.010521, 375.013151, 468.766439, 585.958049, 732.447562, 915.559452, 986.973089, 1063.95699, 1146.945635, 1236.407395, 1332.847171, 1332.314033, 1331.781107, 1331.248395, 1330.715895, 1330.183609],
    bull: [35, 180, 259.56, 374.28552, 539.71972, 701.635636, 912.126327, 1185.764224, 1541.493492, 2003.941539, 2238.803488, 2501.191257, 2794.330872, 3121.82645, 3487.704509, 3486.309429, 3484.914905, 3483.520939, 3482.12753, 3480.734678],
    weighted: [27.14, 123.6, 176.3352, 251.627621, 359.147818, 456.355801, 580.3957, 738.780009, 941.147535, 1199.870452, 1318.959577, 1450.502109, 1595.84539, 1756.486069, 1934.086928, 1932.392745, 1930.71765, 1929.061269, 1927.423231, 1925.803176] },
  };

  // ===== SENSITIVITIES: tornado (I50:K57, already $Bn) =====
  const q3TornadoLabels = ["WACC \u00b1150bps", "Terminal g \u00b1100bps", "Governance discount (dual class)", "Colossus DCs (xAI demand)", "Starship programme (24-mo slip)", "NOL stock (NWC + D&A assumptions)", "Starlink D2C materialisation", "Speculative bucket success"];
  // Sensitivities!J50:J57 — Downside impact ($Bn)
  const q3TornadoDown = [-1229.937406, -339.054653, -854.339803, -357.4251, -346.884512, -25, -2.130718, 3.50284];  // n=8
  // Sensitivities!K50:K57 — Upside impact ($Bn)
  const q3TornadoUp = [2329.976137, 932.16212, 0, 268.068825, 183.714001, 35, 0.852287, 4.203408];  // n=8

  // ===== SENSITIVITIES: per-share WACC x terminal g (B18:G22, $/share) =====
  const q3SensWacc = [0.075038, 0.082538, 0.090038, 0.097537, 0.105038];  // Sensitivities!B18:B22 — WACC rows
  // Sensitivities!C18:C22 — g = 0.03
  const q3SensG0 = [383.989413, 316.040837, 265.652367, 226.937803, 196.367128];  // n=5
  // Sensitivities!D18:D22 — g = 0.035
  const q3SensG1 = [426.20587, 344.816781, 286.218658, 242.175157, 207.980739];  // n=5
  // Sensitivities!E18:E22 — g = 0.04
  const q3SensG2 = [480.471263, 380.357567, 310.895125, 260.060757, 221.38003];  // n=5
  // Sensitivities!F18:F22 — g = 0.045
  const q3SensG3 = [552.802537, 425.366427, 341.050685, 281.350708, 237.01114];  // n=5
  // Sensitivities!G18:G22 — g = 0.05
  const q3SensG4 = [654.022988, 484.208206, 378.738074, 307.119217, 255.482334];  // n=5
  const q3SensGrowth = [0.03, 0.035, 0.04, 0.045, 0.05];  // Sensitivities!C16:G16 — terminal g columns

  // ===== MONTE CARLO: histogram (E20:E60 labels, G20:G60 counts) =====
  const q3McLabels = ["$0.00-0.25T", "$0.25-0.50T", "$0.50-0.75T", "$0.75-1.00T", "$1.00-1.25T", "$1.25-1.50T", "$1.50-1.75T", "$1.75-2.00T", "$2.00-2.25T", "$2.25-2.50T", "$2.50-2.75T", "$2.75-3.00T", "$3.00-3.25T", "$3.25-3.50T", "$3.50-3.75T", "$3.75-4.00T", "$4.00-4.25T", "$4.25-4.50T", "$4.50-4.75T", "$4.75-5.00T", "$5.00-5.25T", "$5.25-5.50T", "$5.50-5.75T", "$5.75-6.00T", "$6.00-6.25T", "$6.25-6.50T", "$6.50-6.75T", "$6.75-7.00T", "$7.00-7.25T", "$7.25-7.50T", "$7.50-7.75T", "$7.75-8.00T", "$8.00-8.25T", "$8.25-8.50T", "$8.50-8.75T", "$8.75-9.00T", "$9.00-9.25T", "$9.25-9.50T", "$9.50-9.75T", "$9.75-10.00T", ">$10T"];
  // Monte_Carlo!G20:G60 — trial counts per bin
  const q3McCounts = [0, 0, 12, 129, 191, 173, 119, 111, 96, 116, 165, 186, 211, 207, 218, 193, 182, 190, 195, 145, 160, 129, 129, 137, 94, 103, 100, 77, 76, 72, 70, 72, 43, 49, 56, 47, 37, 30, 30, 22, 260];  // n=41

  // ===== COMPS: implied equity by method (M44:N55, already $Bn) =====
  const q3CompsLabels = ["Defence EV/Rev implied", "Defence EV/EBITDA implied", "70/30 Defence/AI blend", "AI EV/Rev implied", "AI EV/EBITDA implied", "Satellite EV/Rev implied", "IPO low ($1.75T)", "IPO mid ($1.875T)", "IPO bull ($2.75T)", "Our DCF central", "MC P50", "MC P90"];
  // Comps!N44:N55 — implied equity ($Bn)
  const q3CompsData = [233.744802, 744.944975, 1294.469752, 1417.608187, 2576.694232, 3470.219453, 1750, 1875, 2750, 4271.699014, 4258.831065, 8580.068141];  // n=12

  /* ==========================================================================
   * DESIGN SYSTEM — palette. Do not introduce colours outside this set.
   * Where a source chart used Excel defaults (lavender B3A2C7, blue 4F81BD)
   * the colour is mapped onto the palette below.
   * ========================================================================*/
  const RED        = "#e92c2c";   // primary — the series that matters
  const RED_SOFT   = "#ef5252";   // secondary red / blended cases
  const DARK       = "#26252b";   // second series, axis titles, labels
  const GREY       = "#a4a4a4";   // bear / de-emphasised
  const LIGHT_GREY = "#d9d9d9";   // background series
  const BROWN      = "#b7791f";   // gold accent — weighted / third case
  const BLUE       = "#2563eb";   // right-hand margin lines only

  // Nine-segment stack. Excel fills, mapped onto the palette:
  // E92C2C, 595959, C81E1E, 8C8C8C, 000000, B3A2C7(lavender→gold), 701010, BFBFBF, D9D9D9
  const Q3_SEGMENT_COLORS = [
    RED,         // 1 Launch Services
    DARK,        // 2 Starlink
    "#c81e1e",   // 3 Starshield
    GREY,        // 4 xAI
    "#0d0d10",   // 5 Terrestrial Data Centres
    BROWN,       // 6 Orbital Data Centres  (Excel lavender B3A2C7 → gold accent)
    "#701010",   // 7 X Platform
    "#bfbfbf",   // 8 Terafab
    LIGHT_GREY   // 9 Deep Space Optionality
  ];

  const q3ScenarioColors = { bear: GREY, base: DARK, bull: RED, weighted: BROWN };

  // Annex G declares its lines at 28575 EMU = 2.25pt = 3px, and its EBITDA bars
  // at A6A6A6 rather than the palette grey.
  const EXCEL_LINE  = 3;
  const EBITDA_GREY = "#a6a6a6";

  const FONT = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

  /* ==========================================================================
   * THEME TOKENS. The palette above is the light-theme source of truth. A page
   * may override the neutrals — and the two NEUTRAL series slots — through CSS
   * custom properties so charts stay legible on a dark ground. Hues (red, gold)
   * never change: they work on both grounds.
   * ========================================================================*/
  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function theme() {
    return {
      ink:    cssVar("--chart-ink",    DARK),
      tick:   cssVar("--chart-tick",   "#666666"),
      grid:   cssVar("--chart-grid",   "rgba(38,37,43,.07)"),
      border: cssVar("--chart-border", "rgba(38,37,43,.18)"),
      zero:   cssVar("--chart-zero",   "rgba(38,37,43,.45)"),
      tipBg:  cssVar("--chart-tip-bg", "rgba(20,19,24,.96)"),
      tipInk: cssVar("--chart-tip-ink", "#e8e8ea"),
      tipHed: cssVar("--chart-tip-hed", "#ffffff"),
      // neutral series slots
      dark:   cssVar("--chart-series-dark",  DARK),
      grey:   cssVar("--chart-series-grey",  GREY),
      light:  cssVar("--chart-series-light", LIGHT_GREY),
      darker: cssVar("--chart-series-darker", "#0d0d10"),
      mid:    cssVar("--chart-series-mid",   "#bfbfbf"),
      upper:  cssVar("--chart-series-upper", "#5f5e66")
    };
  }
  // light-theme literal -> theme token, applied by the translation layer
  function swapMap() {
    const t = theme();
    const m = {};
    m[DARK] = t.dark; m[GREY] = t.grey; m[LIGHT_GREY] = t.light;
    m["#0d0d10"] = t.darker; m["#bfbfbf"] = t.mid; m["#5f5e66"] = t.upper;
    m[EBITDA_GREY] = t.grey;                    // Annex G's own A6A6A6
    return m;
  }
  function swapColor(v, m) {
    if (typeof v === "string") return m[v.toLowerCase()] || m[v] || v;
    if (Array.isArray(v)) return v.map(function (x) { return swapColor(x, m); });
    return v;
  }

  /* ==========================================================================
   * SHARED HELPERS — use these, don't hand-roll.
   * ========================================================================*/

  // Axis defaults: 11px bold title, 10px #666 ticks, faint grid. `extra` shallow-merges.
  function slickAxis(title, extra) {
    const t = theme();
    const base = {
      title: title
        ? { display: true, text: title, color: t.ink,
            font: { size: 11, weight: "700", family: FONT } }
        : { display: false },
      ticks: { color: t.tick, font: { size: 10, family: FONT } },
      grid:  { color: t.grid, drawBorder: false, tickLength: 4 },
      border: { color: t.border }
    };
    if (!extra) return base;
    const out = Object.assign({}, base, extra);
    // shallow-merge one level into the nested config objects
    ["title", "ticks", "grid", "border"].forEach(function (k) {
      if (extra[k]) out[k] = Object.assign({}, base[k], extra[k]);
    });
    return out;
  }

  /* Excel bar geometry -> Chart.js percentages.
   * Excel describes a bar group as: n bars of width w, (n-1) inner gaps of
   * (-overlap)*w, and one outer gap of gapWidth*w, all inside one category.
   * Chart.js wants the group's share of the category (categoryPercentage) and
   * the bar's share of its slot (barPercentage). Converting keeps the spacing
   * the workbook actually specifies instead of Chart.js defaults.
   *   Annex G: gapWidth 219, overlap -27, 2 series -> 0.509 / 0.881
   *   Metrics: gapWidth 150, 1 series               -> 0.400 / 1.000
   */
  function excelBars(gapWidth, overlap, n) {
    const gap = (gapWidth == null ? 150 : gapWidth) / 100;
    const sep = Math.max(0, -(overlap == null ? 0 : overlap)) / 100;
    const w = 1 / (n + (n - 1) * sep + gap);          // bar width, as a share of the category
    const group = n * w + (n - 1) * sep * w;          // bars plus the gaps between them
    return { categoryPercentage: group, barPercentage: (n * w) / group };
  }

  // Legend, positioned where the workbook puts it.
  function slickLegendAt(position) {
    return Object.assign({}, slickLegend, { position: position });
  }

  const slickLegend = {
    display: true,
    position: "top",
    align: "start",
    labels: {
      usePointStyle: true, pointStyle: "rectRounded",
      boxWidth: 8, boxHeight: 8, padding: 12,
      color: undefined,                 // filled from the theme by translateConfig
      font: { size: 11, family: FONT }
    }
  };

  // Dark tooltip with a red hairline border.
  function withSlickTooltip(callbacks) {
    const t = theme();
    return {
      enabled: true,
      backgroundColor: t.tipBg,
      titleColor: t.tipHed,
      titleFont: { size: 11, weight: "700", family: FONT },
      bodyColor: t.tipInk,
      bodyFont: { size: 11, family: FONT },
      footerColor: t.tipHed,
      footerFont: { size: 11, weight: "700", family: FONT },
      borderColor: RED,
      borderWidth: 1,
      padding: 10,
      cornerRadius: 4,
      displayColors: true,
      boxWidth: 8, boxHeight: 8, usePointStyle: true,
      callbacks: callbacks || {}
    };
  }

  // Magnitude-aware money. $1,727B / $47B / $8.5B / $0.10B.
  // Exists because fixed decimals made X Platform's axis read "$1B / $0B / $0B".
  function q3Amount(value) {
    if (value === null || value === undefined || isNaN(value)) return "—";
    const v = Number(value), a = Math.abs(v), sign = v < 0 ? "-" : "";
    let body;
    if (a >= 100)     body = Math.round(a).toLocaleString("en-US");
    else if (a >= 10) body = Math.round(a).toString();
    else if (a >= 1)  body = a.toFixed(1);
    else if (a === 0) body = "0";
    else              body = a.toFixed(2);
    return sign + "$" + body + "B";
  }
  // Axis ticks drop the B: every q3Money() axis title already carries ($B).
  // Tooltips keep the full "$1,727B" via q3Amount, where there is no title for context.
  function q3Money() { return function (v) { return q3Amount(v).replace(/B$/, ""); }; }

  // Excel auto-scale (dispUnits thousands / $Bn): pad ~5%, ~10 major units,
  // 1–2–5 steps. Launch 419→450/50, Starlink 1727→2000/200. Used as fallback;
  // Annex G panels pin the workbook/DOCX figure bounds in Q3_SEGMENT_AXES.
  function excelNiceBound(minVal, maxVal) {
    const lo = Math.min(minVal, 0);
    const hi = Math.max(maxVal, 0);
    const padded = hi * 1.05;
    const span = Math.max(padded - lo, Math.abs(hi), 1e-9);
    const rough = span / 10;
    const exp = Math.pow(10, Math.floor(Math.log10(rough)));
    const f = rough / exp;
    const step = f <= 1 ? exp : f <= 2 ? 2 * exp : f <= 5 ? 5 * exp : 10 * exp;
    return {
      min: Math.floor(lo / step) * step,
      max: Math.ceil(padded / step) * step,
      step: step
    };
  }
  function q3BnTick(value) {
    const v = Number(value);
    if (!isFinite(v)) return "";
    const a = Math.abs(v);
    if (a < 1e-8) return "0";
    const body = a >= 10 || Math.abs(v - Math.round(v)) < 1e-8
      ? String(Math.round(a))
      : a.toFixed(1);
    return (v < 0 ? "−" : "") + body;
  }

  // Workbook chart15–23 / DOCX Figures G1–G9 axis windows ($Bn, numFmt=0).
  const Q3_SEGMENT_AXES = {
    launch:        { y: { min: 0, max: 450, step: 50 },    y1: { min: 0, max: 60, step: 10 } },
    starlink:      { y: { min: 0, max: 2000, step: 200 },  y1: { min: 0, max: 600, step: 100 } },
    starshield:    { y: { min: 0, max: 60, step: 10 },     y1: { min: 0, max: 16, step: 2 } },
    xai:           { y: { min: 0, max: 250, step: 50 },    y1: { min: 0, max: 30, step: 5 } },
    terrestrialDc: { y: { min: 0, max: 1800, step: 200 },  y1: { min: -300, max: 300, step: 100 } },
    orbitalDc:     { y: { min: 0, max: 2500, step: 500 },  y1: { min: -50, max: 250, step: 50 } },
    xPlatform:     { y: { min: 0, max: 6, step: 1 },       y1: { min: -0.1, max: 0.7, step: 0.1 } },
    terafab:       { y: { min: 0, max: 1200, step: 200 },  y1: { min: -50, max: 250, step: 50 } },
    deepSpace:     { y: { min: 0, max: 120, step: 20 },    y1: { min: -1, max: 8, step: 1 } }
  };

  // Plain number with a unit suffix, for non-money axes.
  function q3Unit(unit) {
    return function (value) {
      const a = Math.abs(Number(value));
      if (a === 0) return "0" + (unit ? " " + unit : "");
      const body = a >= 100 ? Math.round(a).toLocaleString("en-US")
                 : a >= 10  ? Math.round(a).toString()
                 : a >= 1   ? Number(value).toFixed(1)
                 : Number(value).toFixed(2);
      return (Number(value) < 0 ? "-" : "") + body + (unit ? " " + unit : "");
    };
  }

  // Per-segment share of total + a footer total. For stacked bars.
  function stackedTooltip(unit) {
    const money = !unit || unit === "$B";
    const f = money ? q3Amount : q3Unit(unit);
    return withSlickTooltip({
      label: function (ctx) {
        const total = ctx.chart.data.datasets.reduce(function (s, ds) {
          return s + (Number(ds.data[ctx.dataIndex]) || 0);
        }, 0);
        const v = Number(ctx.parsed.y) || 0;
        const share = total ? (100 * v / total) : 0;
        return " " + ctx.dataset.label + "  " + f(v) +
               (total ? "  (" + share.toFixed(share < 10 ? 1 : 0) + "%)" : "");
      },
      footer: function (items) {
        if (!items.length) return "";
        const ds = items[0].chart.data.datasets, i = items[0].dataIndex;
        const total = ds.reduce(function (s, d) { return s + (Number(d.data[i]) || 0); }, 0);
        return "Total  " + f(total);
      }
    });
  }

  // Diagonal-hatch fill for projected / estimate bars.
  const _patternCache = {};
  function projectedColors(color) {
    if (_patternCache[color]) return _patternCache[color];
    const c = document.createElement("canvas");
    c.width = 8; c.height = 8;
    const g = c.getContext("2d");
    g.fillStyle = "rgba(255,255,255,0)";
    g.fillRect(0, 0, 8, 8);
    g.strokeStyle = color;
    g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0);
    g.moveTo(-2, 2); g.lineTo(2, -2);
    g.moveTo(6, 10); g.lineTo(10, 6);
    g.stroke();
    const ctx2 = document.createElement("canvas").getContext("2d");
    const pat = ctx2.createPattern(c, "repeat");
    _patternCache[color] = pat;
    return pat;
  }

  // One-line single-series bar.
  function q3PlainBar(canvas, labels, data, seriesLabel, axisTitle, unit, color) {
    const money = !unit || unit === "$B";
    const f = money ? q3Amount : q3Unit(unit);
    // Axis ticks drop the $B suffix the axis title already carries; tooltips keep it.
    const axisTick = money ? q3Money() : f;
    return buildChart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: seriesLabel,
          data: data,
          backgroundColor: color || RED,
          borderWidth: 0,
          borderRadius: 2,
          ...excelBars(150, null, 1)          // Metrics_Charts gapWidth 150
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: withSlickTooltip({
            label: function (ctx) { return " " + seriesLabel + "  " + f(ctx.parsed.y); }
          })
        },
        scales: {
          x: slickAxis("Year", { grid: { display: false } }),
          y: slickAxis(axisTitle, { beginAtZero: true, ticks: { callback: axisTick } })
        }
      }
    });
  }

  /* ==========================================================================
   * buildChart — the only sanctioned constructor. Routes every config through
   * the translation layer that applies house style, then constructs the chart.
   * Never call new Chart() directly.
   * ========================================================================*/
  function translateConfig(config) {
    const o = config.options || (config.options = {});
    const t = theme(), m = swapMap();
    // swap the light-theme neutral series colours for their theme equivalents
    (config.data.datasets || []).forEach(function (ds) {
      ["backgroundColor", "borderColor", "hoverBackgroundColor"].forEach(function (k) {
        if (ds[k] !== undefined) ds[k] = swapColor(ds[k], m);
      });
    });
    if (o.plugins && o.plugins.legend && o.plugins.legend.labels &&
        o.plugins.legend.labels.color === undefined) {
      o.plugins.legend = Object.assign({}, o.plugins.legend, {
        labels: Object.assign({}, o.plugins.legend.labels, { color: t.ink })
      });
    }
    o.responsive = true;
    o.maintainAspectRatio = false;          // the stage sets the height — always false
    o.animation = o.animation === undefined ? { duration: 380 } : o.animation;
    o.layout = o.layout || { padding: { top: 4, right: 8, bottom: 0, left: 2 } };
    o.interaction = o.interaction || { mode: "index", intersect: false };
    o.plugins = o.plugins || {};
    if (o.plugins.legend === undefined) o.plugins.legend = slickLegend;
    if (o.plugins.tooltip === undefined) o.plugins.tooltip = withSlickTooltip({});
    o.plugins.title = o.plugins.title || { display: false };
    // a right-hand axis never draws its own grid — the two grids must not fight
    if (o.scales && o.scales.y1) {
      o.scales.y1.position = o.scales.y1.position || "right";
      o.scales.y1.grid = Object.assign({}, o.scales.y1.grid, { display: false });
    }
    (config.data.datasets || []).forEach(function (ds) {
      if (config.type === "line" || ds.type === "line") {
        if (ds.borderWidth === undefined) ds.borderWidth = 2;
        if (ds.pointRadius === undefined) ds.pointRadius = 0;
        if (ds.pointHoverRadius === undefined) ds.pointHoverRadius = 4;
        if (ds.tension === undefined && !ds.cubicInterpolationMode) ds.tension = 0;
      }
    });
    return config;
  }

  function buildChart(canvas, config) {
    if (!canvas) return null;
    const existing = window.Chart && Chart.getChart(canvas);
    if (existing) existing.destroy();       // Chart.js needs the canvas destroyed before reuse
    return new Chart(canvas, translateConfig(config));
  }

  /* ==========================================================================
   * THE CHART CATALOGUE — 22 factories, 32 chart objects.
   * Signature: factory(canvas) -> Chart instance (or null if its data key is
   * missing). Always return through buildChart(canvas, config).
   * ========================================================================*/

  function formatCost(value){
    if (value >= 1000) return "$" + Math.round(value / 1000) + "K/kg";
    return "$" + Math.round(value).toLocaleString() + "/kg";
  }

  // Ported from the memo page — the one visual we keep (Launch Cost Learning Curve).
  const exhibitAnnotationPlugin = {
    id: "exhibitAnnotationPlugin",
    beforeDatasetsDraw(chart, args, opts){
      const ctx = chart.ctx;
      const area = chart.chartArea;
      const x = chart.scales.x;
      if (!area || !x) return;
      ctx.save();
      if (opts && opts.eraBands) {
        opts.eraBands.forEach(function (band) {
          const x1 = Math.max(area.left, x.getPixelForValue(band.from));
          const x2 = Math.min(area.right, x.getPixelForValue(band.to));
          if (!Number.isFinite(x1) || !Number.isFinite(x2)) return;
          ctx.fillStyle = band.color;
          ctx.fillRect(x1, area.top, x2 - x1, area.bottom - area.top);
          ctx.fillStyle = band.labelColor || "rgba(38,37,43,.38)";
          ctx.font = "700 11px Arial";
          ctx.textAlign = "center";
          ctx.fillText(band.label, (x1 + x2) / 2, area.bottom - 14);
        });
      }
      ctx.restore();
    },
    afterDatasetsDraw(chart, args, opts){
      const ctx = chart.ctx;
      const area = chart.chartArea;
      if (!area) return;
      const narrow = (chart.width || (area.right - area.left)) < 500;
      ctx.save();
      if (!narrow) chart.data.datasets.forEach(function (dataset, datasetIndex) {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;
        meta.data.forEach(function (point, index) {
          const raw = dataset.data[index];
          if (!raw || !raw.label) return;
          const offset = raw.labelOffset || {x: 8, y: -12};
          ctx.fillStyle = raw.labelColor || dataset.labelColor || "#555";
          ctx.font = raw.labelFont || "11px Arial";
          ctx.textAlign = raw.labelAlign || "left";
          String(raw.label).split("\n").forEach(function (line, lineIndex) {
            ctx.fillText(line, point.x + offset.x, point.y + offset.y + lineIndex * 13);
          });
        });
      });
      if (opts && opts.callouts && !narrow) {
        opts.callouts.forEach(function (callout) {
          const x = chart.scales.x.getPixelForValue(callout.x) + (callout.dx || 0);
          const y = chart.scales.y.getPixelForValue(callout.y) + (callout.dy || 0);
          const lines = String(callout.text).split("\n");
          ctx.font = "700 12px Arial";
          const width = Math.max.apply(null, lines.map(function (line) { return ctx.measureText(line).width; })) + 18;
          const height = lines.length * 15 + 12;
          ctx.fillStyle = callout.background || "#fff";
          ctx.strokeStyle = callout.border || RED;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y, width, height, 5);
          else ctx.rect(x, y, width, height);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = callout.color || RED;
          ctx.textAlign = "left";
          lines.forEach(function (line, lineIndex) {
            ctx.fillText(line, x + 9, y + 18 + lineIndex * 15);
          });
        });
      }
      ctx.restore();
    }
  };
  if (window.Chart) Chart.register(exhibitAnnotationPlugin);

  const chartFactories = {
    launchCost(canvas){
      return buildChart(canvas, {type:"line", data:{datasets:[
        {label:"Industry learning curve", data:[{x:1967,y:40000},{x:1981,y:58000},{x:1993,y:35000},{x:2004,y:12000},{x:2013,y:4200},{x:2022,y:1000},{x:2030,y:70}], borderColor:"rgba(233,44,44,.28)", borderDash:[7,5], pointRadius:0, tension:.35},
        {label:"Pre-SpaceX vehicles", type:"scatter", data:[
          {x:1967,y:85000,label:"Saturn V\nApollo era",labelOffset:{x:-56,y:-22}},
          {x:1981,y:65000,label:"Space Shuttle\nSTS-1",labelOffset:{x:18,y:38}},
          {x:1988,y:12000,label:"Ariane 4",labelOffset:{x:-54,y:50}},
          {x:1993,y:22000,label:"Delta II",labelOffset:{x:16,y:-24}},
          {x:1999,y:9000,label:"Proton-K",labelOffset:{x:-66,y:34}},
          {x:2004,y:12500,label:"Delta IV Heavy",labelOffset:{x:14,y:-20}}
        ], backgroundColor:"#a7a7a7", borderColor:"#fff", borderWidth:2, pointRadius:6, pointHoverRadius:8},
        {label:"SpaceX Falcon 9 era", data:[
          {x:2010,y:6200,label:"Falcon 9 v1.0\nF9 debut",labelOffset:{x:16,y:-28}},
          {x:2013,y:5200,label:"Falcon 9 v1.1",labelOffset:{x:-92,y:55}},
          {x:2016,y:3100,label:"Falcon 9 + landing\n1st reuse",labelOffset:{x:18,y:-36}},
          {x:2018,y:2900,label:"Falcon 9 Block 5\nroutine reuse",labelOffset:{x:-98,y:58}},
          {x:2022,y:2800,label:"Falcon 9\nrider/ops est.",labelOffset:{x:18,y:38}}
        ], borderColor:RED, backgroundColor:RED, pointStyle:"rectRot", pointRadius:7, pointHoverRadius:9, tension:.25},
        {label:"Rocket Lab benchmark", type:"scatter", data:[
          {x:2025,y:28300,label:"Rocket Lab Electron\n2025 avg rev./launch",tooltipLabel:"Rocket Lab Electron\n2025 avg rev./launch",labelOffset:{x:-156,y:-32},detail:"$8.5M revenue per launch / 300 kg LEO capacity"}
        ], backgroundColor:BLUE, borderColor:"#fff", borderWidth:2, pointStyle:"circle", pointRadius:7, pointHoverRadius:9, labelColor:BLUE},
        {label:"China launch benchmarks", type:"scatter", data:[
          {x:2017,y:10000,tooltipLabel:"Long March 11\nFAA est.",detail:"$5.3M estimated launch price / 530 kg LEO capacity"},
          {x:2017,y:8570,tooltipLabel:"Long March 2D\nFAA est.",detail:"$30M estimated launch price / 3,500 kg LEO capacity"},
          {x:2017,y:5830,tooltipLabel:"Long March 3B\nFAA est.",detail:"$70M estimated launch price / 12,000 kg LEO capacity"},
          {x:2024,y:5000,label:"Gravity-1\nreported",tooltipLabel:"Gravity-1\nreported",labelOffset:{x:10,y:-32},detail:"Published Gravity-1 figure: roughly $5,000/kg to LEO"}
        ], backgroundColor:BROWN, borderColor:"#fff", borderWidth:2, pointStyle:"triangle", pointRadius:7, pointHoverRadius:9, labelColor:"#8a5a13"},
        {label:"Starship era (est./target)", data:[
          {x:2024,y:400,label:"Starship\nearly ops est.",labelOffset:{x:8,y:-24}},
          {x:2026,y:100,label:"Starship\n2026 target",labelOffset:{x:8,y:38}},
          {x:2030,y:10,label:"Starship fleet\n2030 goal",labelOffset:{x:-86,y:-38}}
        ], borderColor:DARK, backgroundColor:DARK, pointStyle:"rect", pointRadius:7, pointHoverRadius:9, tension:.15}
      ]}, options:{responsive:true, maintainAspectRatio:false, interaction:{mode:"nearest",intersect:true}, plugins:{legend:{position:"top"}, tooltip:{callbacks:{label(ctx){const raw=ctx.raw;const visibleLabel=raw.tooltipLabel||raw.label;const base=ctx.dataset.label+": "+(visibleLabel?visibleLabel.replace(/\n/g," - ")+" / ":"")+raw.x+" / "+formatCost(raw.y);return raw.detail?[base,raw.detail]:base;}}}, exhibitAnnotationPlugin:{eraBands:[{from:2010,to:2023.5,color:"rgba(233,44,44,.08)",label:"FALCON 9 ERA",labelColor:"rgba(233,44,44,.55)"},{from:2023.5,to:2032,color:"rgba(38,37,43,.06)",label:"STARSHIP ERA",labelColor:"rgba(38,37,43,.48)"}],callouts:[{x:2017,y:850,text:"SpaceX: ~98% cost\nreduction 2010-2026",dx:0,dy:-20}]}}, scales:{x:{type:"linear",min:1963,max:2032,title:{display:true,text:"Year"},ticks:{stepSize:10},grid:{color:"#f2f2f2"}}, y:{type:"logarithmic",min:5,max:200000,title:{display:true,text:"Cost / price per kg to LEO (log scale)"},ticks:{callback:formatCost},grid:{color:"#eee"}}}}});
    },

    // Summary!G7:G10 — EV by horizon plus the 55/35/10 blended fair value.
    q3EvByHorizon(canvas) {
      const isBlend = q3EvHorizonLabels.map(function (l) { return /blend/i.test(l); });
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: q3EvHorizonLabels.map(function (l) { return l.trim(); }),
          datasets: [{
            label: "Implied EV ($B)",
            data: q3EvHorizonData,
            // the blend is hatched: it is a composite of the three horizons, not a
            // modelled horizon of its own
            backgroundColor: isBlend.map(function (b) { return b ? projectedColors(BROWN) : RED; }),
            borderColor: isBlend.map(function (b) { return b ? BROWN : RED; }),
            borderWidth: 0, borderRadius: 2,
            ...excelBars(219, -27, 1)          // Summary chart #1
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: withSlickTooltip({
              label: function (ctx) { return " Implied EV ($B)  " + q3Amount(ctx.parsed.y); },
              afterLabel: function (ctx) {
                return isBlend[ctx.dataIndex] ? "55% / 35% / 10% horizon blend" : "";
              }
            })
          },
          scales: {
            x: slickAxis("Horizon", { grid: { display: false } }),
            y: slickAxis("Enterprise Value ($B)", { beginAtZero: true, ticks: { callback: q3Money() } })
          }
        }
      });
    },

    // Metrics_Charts!C5:Q5 + C6:Q6 — launches per year, Falcon 9 + Starship.
    q3Launches(canvas) {
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: Q3_YEARS_15,
          datasets: [
            { label: "Falcon 9 launches (#)", data: q3Falcon9,
              backgroundColor: RED, borderWidth: 0, stack: "l", ...excelBars(150, 100, 1) },
            { label: "Starship launches (#)", data: q3Starship,
              backgroundColor: DARK, borderWidth: 0, stack: "l", ...excelBars(150, 100, 1) }
          ]
        },
        options: {
          plugins: { legend: slickLegendAt("right"), tooltip: stackedTooltip("") },
          scales: {
            x: slickAxis("Year", { stacked: true, grid: { display: false } }),
            y: slickAxis("# launches", { stacked: true, beginAtZero: true,
                                         ticks: { callback: q3Unit("") } })
          }
        }
      });
    },

    // Metrics_Charts!C7:Q7 — mass to orbit (metric tons).
    q3MassToOrbitChart(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3MassToOrbit,
                        "Mass to orbit (t)", "Metric tons", "t", RED);
    },

    // Metrics_Charts!C8:Q8 — Starlink subscribers (M).
    q3StarlinkSubsChart(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3StarlinkSubs,
                        "Starlink subscribers (M)", "Subscribers (M)", "M", RED);
    },

    // Metrics_Charts!C9:Q9 — Colossus installed compute (GW).
    q3ColossusCompute(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3ColossusGw,
                        "Colossus installed compute (GW)", "Installed compute (GW)", "GW", RED);
    },

    // Metrics_Charts!C14:Q22 — expected revenue by segment, nine-series stack ($B).
    q3RevenueBySegment(canvas) {
      const series = [
        ["Launch Services",          q3RevLaunchData],
        ["Starlink",                 q3RevStarlinkData],
        ["Starshield",               q3RevStarshieldData],
        ["xAI",                      q3RevXaiData],
        ["Terrestrial Data Centres", q3RevTerrestrialData],
        ["Orbital Data Centres",     q3RevOrbitalData],
        ["X Platform",               q3RevXPlatformData],
        ["Terafab",                  q3RevTerafabData],
        ["Deep Space Optionality",   q3RevDeepSpaceData]
      ];
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: Q3_YEARS_15,
          datasets: series.map(function (s, i) {
            return { label: s[0], data: s[1], backgroundColor: Q3_SEGMENT_COLORS[i],
                     borderWidth: 0, stack: "rev", ...excelBars(150, 100, 1) };
          })
        },
        options: {
          plugins: { legend: slickLegendAt("right"), tooltip: stackedTooltip("$B") },
          scales: {
            x: slickAxis("Year", { stacked: true, grid: { display: false } }),
            y: slickAxis("Expected revenue ($B)", { stacked: true, beginAtZero: true,
                                                    ticks: { callback: q3Money() } })
          }
        }
      });
    },

    // Metrics_Charts row 14 — Launch Services revenue ($B).
    q3RevLaunch(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3RevLaunchData,
                        "Launch Services", "Revenue ($B)", "$B", RED);
    },
    // Metrics_Charts row 16 — Starshield revenue ($B).
    q3RevStarshield(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3RevStarshieldData,
                        "Starshield", "Revenue ($B)", "$B", RED);
    },
    // Metrics_Charts row 17 — xAI revenue ($B).
    q3RevXai(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3RevXaiData,
                        "xAI", "Revenue ($B)", "$B", RED);
    },
    // Metrics_Charts row 19 — Orbital Data Centres revenue ($B).
    q3RevOrbitalDc(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3RevOrbitalData,
                        "Orbital Data Centres", "Revenue ($B)", "$B", RED);
    },
    // Metrics_Charts row 20 — X Platform revenue ($B).
    q3RevXPlatform(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3RevXPlatformData,
                        "X Platform", "Revenue ($B)", "$B", RED);
    },
    // Metrics_Charts row 21 — Terafab revenue ($B).
    q3RevTerafab(canvas) {
      return q3PlainBar(canvas, Q3_YEARS_15, q3RevTerafabData,
                        "Terafab", "Revenue ($B)", "$B", RED);
    },

    // Annex_G_Panels!C5:V5 (= DCF!C52:V52) — adjusted UFCF, colour by sign.
    q3AdjustedUfcf(canvas) {
      const colors = q3AdjUfcfData.map(function (v) { return v < 0 ? GREY : RED; });
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: Q3_YEARS_20,
          datasets: [{ label: "Adjusted UFCF", data: q3AdjUfcfData,
                       backgroundColor: colors, borderWidth: 0,
                       ...excelBars(219, -27, 1) }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: withSlickTooltip({
              label: function (ctx) { return " Adjusted UFCF  " + q3Amount(ctx.parsed.y); },
              afterLabel: function (ctx) { return ctx.parsed.y < 0 ? "cash burn" : ""; }
            })
          },
          scales: {
            x: slickAxis("Year", { grid: { display: false } }),
            y: slickAxis("Adjusted UFCF ($B)", { ticks: { callback: q3Money() },
                 grid: { color: function (c) {
                   const t = theme();
                   return c.tick.value === 0 ? t.zero : t.grid; } } })
          }
        }
      });
    },

    // Annex_G_Panels!C5:V6 — adjusted UFCF (bars) vs total revenue (line), dual axis.
    q3UfcfVsRevenue(canvas) {
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: Q3_YEARS_20,
          datasets: [
            { type: "bar", label: "Adjusted UFCF", data: q3AdjUfcfData,
              backgroundColor: RED, borderWidth: 0, yAxisID: "y", order: 1,
              ...excelBars(219, -27, 1) },
            { type: "line", label: "Total revenue", data: q3TotalRevData,
              borderColor: DARK, backgroundColor: DARK, yAxisID: "y1", order: 2,
              borderWidth: EXCEL_LINE }                 // workbook 2.25pt
          ]
        },
        options: {
          plugins: {
            legend: slickLegendAt("bottom"),
            tooltip: withSlickTooltip({
              label: function (ctx) { return " " + ctx.dataset.label + "  " + q3Amount(ctx.parsed.y); }
            })
          },
          scales: {
            x:  slickAxis("Year", {
                  grid: { display: false },
                  ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
                }),
            y:  slickAxis("Adjusted UFCF ($Bn)", {
                  min: -400, max: 1600,
                  ticks: { callback: q3BnTick, stepSize: 200 }
                }),
            y1: slickAxis("Total revenue ($Bn)", {
                  position: "right", min: 0, max: 8000,
                  ticks: { callback: q3BnTick, stepSize: 1000 },
                  grid: { drawOnChartArea: false }
                })
          }
        }
      });
    },

    // Annex_G_Panels rows 10-52 — one panel per segment, selected by data-segment-key.
    // Revenue + EBITDA bars on the left axis, UFCF line on the right.
    q3SegmentPanel(canvas) {
      const key = canvas.dataset.segmentKey;
      const s = Q3_SEGMENT_SERIES[key];
      if (!s) return null;
      const ax = Q3_SEGMENT_AXES[key] || {};
      const left = ax.y || excelNiceBound(0, Math.max.apply(null, s.revenue.concat(s.ebitda)));
      const right = ax.y1 || excelNiceBound(Math.min.apply(null, s.ufcf), Math.max.apply(null, s.ufcf));
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: Q3_YEARS_20.map(String),
          datasets: [
            // Annex_G_Panels: clustered, gapWidth 219, overlap -27 — the pair is
            // separated by 27% of a bar width, exactly as the workbook specifies
            { type: "bar", label: "Revenue", data: s.revenue,
              backgroundColor: DARK, borderWidth: 0, yAxisID: "y", order: 1,
              clip: false, ...excelBars(219, -27, 2) },
            { type: "bar", label: "EBITDA", data: s.ebitda,
              backgroundColor: EBITDA_GREY, borderWidth: 0, yAxisID: "y", order: 2,
              clip: false, ...excelBars(219, -27, 2) },
            { type: "line", label: "UFCF", data: s.ufcf,
              borderColor: RED, backgroundColor: RED, yAxisID: "y1", order: 3,
              borderWidth: EXCEL_LINE, fill: false, pointRadius: 0,
              pointHoverRadius: 4, tension: 0, clip: false, spanGaps: true }
          ]
        },
        options: {
          plugins: {
            legend: slickLegendAt("bottom"),
            tooltip: withSlickTooltip({
              title: function (items) { return s.label + " · " + items[0].label; },
              label: function (ctx) { return " " + ctx.dataset.label + "  " + q3Amount(ctx.parsed.y); }
            })
          },
          scales: {
            x:  slickAxis("Year", {
                  type: "category",
                  offset: true,
                  grid: { display: false },
                  ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
                }),
            y:  slickAxis("Revenue / EBITDA ($Bn)", {
                  type: "linear", min: left.min, max: left.max, beginAtZero: left.min === 0,
                  ticks: { callback: q3BnTick, stepSize: left.step }
                }),
            y1: slickAxis("UFCF ($Bn)", {
                  type: "linear", position: "right", min: right.min, max: right.max,
                  ticks: { callback: q3BnTick, stepSize: right.step },
                  grid: { drawOnChartArea: false }
                })
          }
        }
      });
    },

    // Sum of Parts!P39:S47 — segment EV by scenario, with Base values printed on the bars.
    q3Sotp(canvas) {
      const printBase = {
        id: "q3SotpBaseLabels",
        afterDatasetsDraw: function (chart) {
          const meta = chart.getDatasetMeta(1);          // dataset 1 = Base EV
          if (!meta || meta.hidden) return;
          const g = chart.ctx;
          g.save();
          g.font = "700 9px " + FONT;
          g.fillStyle = theme().ink;
          g.textAlign = "center";
          g.textBaseline = "bottom";
          meta.data.forEach(function (el, i) {
            const v = chart.data.datasets[1].data[i];
            if (v === null || v === undefined) return;
            const y = v >= 0 ? el.y - 4 : el.y + 12;
            g.fillText(q3Amount(v), el.x, y);
          });
          g.restore();
        }
      };
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: q3SotpLabels,
          datasets: [
            { label: "Bear EV", data: q3SotpBear, backgroundColor: GREY,  borderWidth: 0, ...excelBars(150, null, 3) },
            { label: "Base EV", data: q3SotpBase, backgroundColor: DARK,  borderWidth: 0, ...excelBars(150, null, 3) },
            { label: "Bull EV", data: q3SotpBull, backgroundColor: BROWN, borderWidth: 0, ...excelBars(150, null, 3) }
          ]
        },
        options: {
          plugins: {
            legend: slickLegend,
            tooltip: withSlickTooltip({
              label: function (ctx) { return " " + ctx.dataset.label + "  " + q3Amount(ctx.parsed.y); }
            })
          },
          scales: {
            x: slickAxis("Business segment", { grid: { display: false },
                 ticks: { maxRotation: 45, minRotation: 45, autoSkip: false } }),
            y: slickAxis("Enterprise value ($B)", { ticks: { callback: q3Money() } })
          }
        },
        plugins: [printBase]
      });
    },

    // Sum of Parts!U39:AA47 — how segments stack to total EV, cumulative.
    q3SotpCumulative(canvas) {
      const line = function (label, data, color, dash) {
        return { label: label, data: data, borderColor: color, backgroundColor: color,
                 cubicInterpolationMode: "monotone", borderDash: dash || [], fill: false };
      };
      return buildChart(canvas, {
        type: "line",
        data: {
          labels: q3CumLabels,
          datasets: [
            line("Base cumulative", q3CumBase, q3ScenarioColors.base),
            line("Bear cumulative", q3CumBear, q3ScenarioColors.bear),
            line("Bull cumulative", q3CumBull, q3ScenarioColors.bull)
          ]
        },
        options: {
          plugins: {
            legend: slickLegend,
            tooltip: withSlickTooltip({
              label: function (ctx) { return " " + ctx.dataset.label + "  " + q3Amount(ctx.parsed.y); }
            })
          },
          scales: {
            x: slickAxis("Segment (largest to smallest by Base EV)",
                         { grid: { display: false },
                           ticks: { maxRotation: 45, minRotation: 45, autoSkip: false } }),
            y: slickAxis("Cumulative EV ($B)", { beginAtZero: true, ticks: { callback: q3Money() } })
          }
        }
      });
    },

    // Business-line tabs — Bear/Base/Bull revenue paths plus the dashed
    // scenario-weighted line. Selected by data-scenario-key.
    q3ScenarioPath(canvas) {
      const key = canvas.dataset.scenarioKey;
      const s = Q3_SCENARIO_SERIES[key];
      if (!s) return null;
      const line = function (label, data, color, dash) {
        return { label: label, data: data, borderColor: color, backgroundColor: color,
                 borderDash: dash || [], tension: .25, fill: false,
                 borderWidth: dash ? 2.4 : 2 };
      };
      return buildChart(canvas, {
        type: "line",
        data: {
          labels: Q3_YEARS_20,
          datasets: [
            line("Bear revenue", s.bear, q3ScenarioColors.bear),
            line("Base revenue", s.base, q3ScenarioColors.base),
            line("Bull revenue", s.bull, q3ScenarioColors.bull),
            line("Scenario-weighted revenue", s.weighted, q3ScenarioColors.weighted, [6, 4])
          ]
        },
        options: {
          plugins: {
            legend: slickLegendAt("right"),
            tooltip: withSlickTooltip({
              title: function (items) { return s.label + " · " + items[0].label; },
              label: function (ctx) { return " " + ctx.dataset.label + "  " + q3Amount(ctx.parsed.y); }
            })
          },
          scales: {
            x: slickAxis("Year", { grid: { display: false } }),
            y: slickAxis("Revenue ($B)", { beginAtZero: true, ticks: { callback: q3Money() } })
          }
        }
      });
    },

    // Sensitivities!I50:K57 — drivers ranked by equity impact, diverging.
    q3Tornado(canvas) {
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: q3TornadoLabels,
          datasets: [
            { label: "Downside", data: q3TornadoDown, backgroundColor: RED_SOFT,
              borderWidth: 0, ...excelBars(150, null, 2) },
            { label: "Upside",   data: q3TornadoUp,   backgroundColor: BROWN,
              borderWidth: 0, ...excelBars(150, null, 2) }
          ]
        },
        options: {
          indexAxis: "y",
          interaction: { mode: "index", intersect: false, axis: "y" },
          plugins: {
            legend: slickLegend,
            tooltip: withSlickTooltip({
              label: function (ctx) { return " " + ctx.dataset.label + "  " + q3Amount(ctx.parsed.x); }
            })
          },
          scales: {
            x: slickAxis("Impact on blended equity ($B)", {
                 ticks: { callback: q3Money() },
                 grid: { color: function (c) {
                   const t = theme();
                   return c.tick.value === 0 ? t.zero : t.grid; } } }),
            y: slickAxis("Driver", { grid: { display: false }, ticks: { autoSkip: false } })
          }
        }
      });
    },

    // Sensitivities!B18:G22 — value per share, one line per terminal-growth column.
    q3PerShareSensitivity(canvas) {
      const cols = [q3SensG0, q3SensG1, q3SensG2, q3SensG3, q3SensG4];
      const colors = [LIGHT_GREY, GREY, DARK, BROWN, RED];
      const pct = function (v) { return (v * 100).toFixed(1) + "%"; };
      return buildChart(canvas, {
        type: "line",
        data: {
          labels: q3SensWacc.map(pct),
          datasets: cols.map(function (data, i) {
            return { label: "g " + pct(q3SensGrowth[i]), data: data,
                     borderColor: colors[i], backgroundColor: colors[i],
                     pointRadius: 2.5, pointHoverRadius: 5, tension: .2, fill: false };
          })
        },
        options: {
          plugins: {
            legend: slickLegendAt("right"),
            tooltip: withSlickTooltip({
              title: function (items) { return "WACC " + items[0].label; },
              label: function (ctx) {
                return " " + ctx.dataset.label + "   $" + Number(ctx.parsed.y).toFixed(2);
              }
            })
          },
          scales: {
            x: slickAxis("WACC", { grid: { display: false } }),
            y: slickAxis("Value per share ($)", {
                 ticks: { callback: function (v) { return "$" + Math.round(v); } } })
          }
        }
      });
    },

    // Monte_Carlo!E20:G60 — distribution of equity value, tail bins tinted.
    q3MonteCarlo(canvas) {
      const n = q3McCounts.length;
      const colors = q3McCounts.map(function (_, i) {
        if (i === n - 1) return GREY;              // the open-ended >$10T bin
        if (i <= 3)      return LIGHT_GREY;        // the empty / thin left tail
        if (i >= n - 6)  return "#5f5e66";         // upper tail
        return DARK;
      });
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: q3McLabels,
          datasets: [{ label: "Trials", data: q3McCounts, backgroundColor: colors,
                       borderWidth: 0, ...excelBars(150, null, 1) }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: withSlickTooltip({
              title: function (items) { return "Equity value  " + items[0].label; },
              label: function (ctx) {
                const total = q3McCounts.reduce(function (a, b) { return a + b; }, 0);
                const share = total ? (100 * ctx.parsed.y / total) : 0;
                return " " + ctx.parsed.y + " trials  (" + share.toFixed(1) + "% of 4,632)";
              }
            })
          },
          scales: {
            x: slickAxis("Equity value bucket ($T)", { grid: { display: false },
                 ticks: { maxRotation: 90, minRotation: 90, autoSkip: false, font: { size: 8 } } }),
            y: slickAxis("Number of trials", { beginAtZero: true, ticks: { callback: q3Unit("") } })
          }
        }
      });
    },

    // Comps!M44:N55 — implied equity by valuation method, colour-coded by method.
    q3Comps(canvas) {
      const colorFor = function (label) {
        if (/IPO/i.test(label))                 return GREY;
        if (/DCF/i.test(label))                 return RED;
        if (/^MC /i.test(label))                return RED_SOFT;
        if (/Defence/i.test(label))             return LIGHT_GREY;
        if (/blend/i.test(label))               return BROWN;
        if (/Satellite/i.test(label))           return "#bfbfbf";
        return DARK;                            // AI / growth multiples
      };
      return buildChart(canvas, {
        type: "bar",
        data: {
          labels: q3CompsLabels,
          datasets: [{ label: "Equity ($Bn)", data: q3CompsData,
                       backgroundColor: q3CompsLabels.map(colorFor),
                       borderWidth: 0, ...excelBars(150, null, 1) }]
        },
        options: {
          indexAxis: "y",
          plugins: {
            legend: { display: false },
            tooltip: withSlickTooltip({
              label: function (ctx) { return " Implied equity  " + q3Amount(ctx.parsed.x); }
            })
          },
          scales: {
            x: slickAxis("Implied equity ($B)", { beginAtZero: true, ticks: { callback: q3Money() } }),
            y: slickAxis("Valuation methodology", { grid: { display: false }, ticks: { autoSkip: false } })
          }
        }
      });
    }
  };

  /* ==========================================================================
   * ENGINE — decoration, lazy init, lightbox, print, build stamp.
   * ========================================================================*/
  const instances = new WeakMap();          // canvas -> Chart, so a chart is built once

  function canvasesIn(scope) {
    return Array.prototype.slice.call(
      (scope || document).querySelectorAll("canvas[data-chart-key]"));
  }

  // Loud failure: a missing factory logs a specific error and paints the canvas.
  function paintUnknown(canvas, key) {
    const g = canvas.getContext("2d");
    const w = canvas.width || 300, h = canvas.height || 150;
    g.save();
    g.clearRect(0, 0, w, h);
    g.fillStyle = cssVar("--chart-fail-bg", "#fdf2f2");
    g.fillRect(0, 0, w, h);
    g.strokeStyle = RED; g.lineWidth = 1;
    g.strokeRect(.5, .5, w - 1, h - 1);
    g.fillStyle = RED;
    g.font = "700 13px " + FONT;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("Unknown chart: " + key, w / 2, h / 2);
    g.restore();
  }

  function initChart(canvas) {
    const key = canvas.dataset.chartKey;
    if (!key) return null;
    if (instances.has(canvas) && Chart.getChart(canvas)) return instances.get(canvas);
    const factory = chartFactories[key];
    if (typeof factory !== "function") {
      console.error("[SpaceXDashboardCharts] no factory registered for data-chart-key=\"" +
                    key + "\" — the canvas will render blank. Registered keys: " +
                    Object.keys(chartFactories).join(", "));
      paintUnknown(canvas, key);
      return null;
    }
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();       // guard before reuse
    let chart = null;
    try {
      chart = factory(canvas);
    } catch (err) {
      console.error("[SpaceXDashboardCharts] factory \"" + key + "\" threw:", err);
      paintUnknown(canvas, key);
      return null;
    }
    if (!chart) {
      console.error("[SpaceXDashboardCharts] factory \"" + key +
                    "\" returned null — its data key is missing (segment=" +
                    canvas.dataset.segmentKey + ", scenario=" + canvas.dataset.scenarioKey + ")");
      paintUnknown(canvas, key);
      return null;
    }
    instances.set(canvas, chart);
    canvas.setAttribute("data-chart-built", "1");
    return chart;
  }

  function isLive(canvas) {
    const r = canvas.getBoundingClientRect();
    if (r.width <= 20 || r.height <= 20) return false;   // collapsed containers render at zero size
    const card = canvas.closest("[data-expand-card]");
    if (card && !card.classList.contains("is-open")) return false;
    return true;
  }

  function initVisibleCharts(scope) {
    let n = 0;
    canvasesIn(scope).forEach(function (c) { if (isLive(c) && initChart(c)) n++; });
    return n;
  }

  function decorate(scope) {
    canvasesIn(scope).forEach(function (c) {
      if (c.dataset.ixDecorated) return;
      c.dataset.ixDecorated = "1";
      c.classList.add("ix-canvas");
      c.style.cursor = "zoom-in";
      c.addEventListener("click", function () { openLightbox(c); });
    });
  }

  function replaceChartImages(scope) {
    decorate(scope);
    return initVisibleCharts(scope);
  }

  /* --- Lightbox: a zoomable copy. The metadata MUST travel with it or the
   * expanded view builds the wrong chart — or nothing. ---------------------*/
  function copyCanvasMetadata(from, to) {
    ["chartKey", "segmentKey", "scenarioKey"].forEach(function (k) {
      if (from.dataset[k] !== undefined) to.dataset[k] = from.dataset[k];
    });
    const al = from.getAttribute("aria-label");
    if (al) to.setAttribute("aria-label", al);
    return to;
  }

  let lightbox = null;
  function openLightbox(source) {
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "ix-lightbox";
      lightbox.innerHTML =
        '<div class="ix-lightbox-inner">' +
          '<button class="ix-lightbox-close" aria-label="Close">×</button>' +
          '<div class="ix-lightbox-title"></div>' +
          '<div class="ix-lightbox-stage"><canvas></canvas></div>' +
        '</div>';
      document.body.appendChild(lightbox);
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox || e.target.classList.contains("ix-lightbox-close")) closeLightbox();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox();
      });
    }
    const panel = source.closest(".interactive-chart-panel");
    const titleEl = panel && panel.querySelector(".interactive-chart-title");
    lightbox.querySelector(".ix-lightbox-title").textContent = titleEl ? titleEl.textContent : "";
    const stage = lightbox.querySelector(".ix-lightbox-stage");
    const old = stage.querySelector("canvas");
    if (old && Chart.getChart(old)) Chart.getChart(old).destroy();
    stage.innerHTML = "<canvas></canvas>";
    const target = copyCanvasMetadata(source, stage.querySelector("canvas"));
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () {
      const key = target.dataset.chartKey;
      const f = chartFactories[key];
      if (typeof f !== "function") { paintUnknown(target, key); return; }
      try { f(target); } catch (e) { console.error("[SpaceXDashboardCharts] lightbox:", e); }
    });
  }
  function closeLightbox() {
    if (!lightbox) return;
    const c = lightbox.querySelector("canvas");
    if (c && Chart.getChart(c)) Chart.getChart(c).destroy();
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* --- Re-entry points ---------------------------------------------------- */
  function prepareForPrint(scope) {
    const root = scope || document;
    // force every accordion open so nothing renders at zero size
    Array.prototype.slice.call(root.querySelectorAll("[data-expand-card]"))
      .forEach(function (card) { card.classList.add("is-open"); });
    decorate(root);
    let built = 0;
    canvasesIn(root).forEach(function (c) { if (initChart(c)) built++; });
    canvasesIn(root).forEach(function (c) {
      const ch = instances.get(c);
      if (ch) ch.resize();
    });
    return built;
  }

  let moTimer = null;
  function watchDom() {
    if (!window.MutationObserver) return;
    const mo = new MutationObserver(function () {
      clearTimeout(moTimer);
      moTimer = setTimeout(function () { replaceChartImages(document); }, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true,
                                attributeFilter: ["class"] });
  }

  // Rebuild every live chart when the viewer's theme changes, so the neutrals
  // and the two neutral series slots re-resolve against the new ground.
  function rebuildAll() {
    canvasesIn(document).forEach(function (c) {
      const ch = instances.get(c);
      if (!ch) return;
      ch.destroy();
      instances.delete(c);
      c.removeAttribute("data-chart-built");
    });
    initVisibleCharts(document);
  }

  function watchTheme() {
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", rebuildAll);
    }
    if (window.MutationObserver) {
      new MutationObserver(rebuildAll).observe(document.documentElement,
        { attributes: true, attributeFilter: ["data-theme"] });
    }
  }

  function boot() {
    replaceChartImages(document);
    watchDom();
    watchTheme();
    window.addEventListener("resize", function () {
      canvasesIn(document).forEach(function (c) {
        const ch = instances.get(c);
        if (ch && isLive(c)) ch.resize();
      });
    });
  }

  window.SpaceXDashboardCharts = {
    build: CHART_ENGINE_BUILD,
    chartFactories: chartFactories,
    factoryKeys: Object.keys(chartFactories),
    replaceChartImages: replaceChartImages,
    initVisibleCharts: initVisibleCharts,
    initChart: initChart,
    prepareForPrint: prepareForPrint,
    rebuildAll: rebuildAll,
    getChart: function (canvas) { return instances.get(canvas) || null; },
    palette: { RED: RED, RED_SOFT: RED_SOFT, DARK: DARK, GREY: GREY,
               LIGHT_GREY: LIGHT_GREY, BROWN: BROWN, BLUE: BLUE },
    segmentColors: Q3_SEGMENT_COLORS,
    years: { y10: Q3_YEARS_10, y15: Q3_YEARS_15, y20: Q3_YEARS_20 },
    helpers: { q3Amount: q3Amount, slickAxis: slickAxis, withSlickTooltip: withSlickTooltip,
               stackedTooltip: stackedTooltip, q3PlainBar: q3PlainBar,
               projectedColors: projectedColors, buildChart: buildChart }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
