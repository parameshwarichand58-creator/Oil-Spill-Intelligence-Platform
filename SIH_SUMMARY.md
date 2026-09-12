\# OCEAN EYE — SIH Summary



\## One-line pitch



OCEAN EYE is a prototype intelligence workflow that fuses satellite SAR, AIS, weather,

drift modelling, AI detection, and human review into a single oil-spill detection and

vessel-attribution system. Demo modules use simulated / live-ready interfaces; the

production version would connect to authenticated satellite and AIS APIs.



\---



\## Problem



\- Oil spills in coastal waters often go undetected for hours or days.

\- Existing monitoring systems detect the spill but do not attribute it to a vessel,

&#x20; predict its drift, or trigger a coordinated response.

\- Coastal fisheries and communities are hit before authorities can act.



\## Solution



One incident workflow:



Satellite image -> AI detection -> Geolocation -> Drift prediction

&#x20; -> Vessel correlation -> Attribution score -> Risk -> Alert

&#x20; -> Human review -> Response



Every step is connected through a single Incident ID. Each module reads and writes

to a shared incident store, so the map, alerts, review queue, and voice announcer

stay in sync.



\---



\## Architecture



&#x20;   SATELLITES              AIS             WEATHER

&#x20;/      |       \\             |                  |

MODIS  Sentinel-1  RISAT      |                  |

&#x20;\\      |       /             |                  |

&#x20; Data ingestion --------------+------------------+

&#x20;         |

&#x20; Pre-processing (geo-ref, speckle filter, water-body seg.)

&#x20;         |

&#x20; AI detection (dark-spot + shape + temporal persistence)

&#x20;         |

&#x20; Geospatial engine (polygon, area, centroid)

&#x20;         |

&#x20; Fusion engine (spill + AIS + weather + drift)

&#x20;         |

&#x20; Risk + Attribution engine

&#x20;         |

&#x20; Alert engine --> Human review --> Response team



\---



\## Data provenance (important for judges)



| Source | Status |

|---|---|

| Satellite detection | Simulated (live-ready; production = Copernicus / ASF) |

| AIS vessels | Simulated (production = AISStream / MarineTraffic) |

| Weather / wind | Live (Open-Meteo Marine API) |

| AI detection model | Prototype rule-based SAR anomaly detector |

| Drift model | Simplified advection-diffusion with wind + current input |

| Vessel attribution | Rule-based scoring (spatial + temporal + kinematic) |

| Response times | Simulated |

| Voice alert | Browser SpeechSynthesis |



Every metric on the dashboard is labelled with its origin:



\- LIVE      = real external API

\- MODEL     = output from our algorithm

\- SIM       = simulated for demonstration

\- PREDICTED = drift / risk model output

\- ARCHIVED  = historical replay



\---



\## Model card (prototype)



| Field | Value |

|---|---|

| Model | Rule-based SAR anomaly detector (baseline) |

| Input | Sentinel-1 GRD, VV/VH, 10 m |

| Features | Backscatter, local contrast, shape, GLCM texture |

| Training data | Not yet trained; uses heuristic thresholds |

| Precision / Recall / F1 | Not measured (prototype) |

| Planned model | U-Net segmentation trained on labelled SAR oil spills |

| Planned dataset | Sentinel-1 oil-spill benchmark + curated scenes |



We do not claim measured accuracy. We claim a working detection workflow.



\---



\## Scientific accuracy — why a dark patch is not always oil



Dark SAR anomalies can be caused by:

\- low-wind zones

\- natural biological slicks

\- ship wakes

\- atmospheric effects

\- sensor noise



Our detector reduces false positives by requiring:

1\. Low backscatter contrast

2\. Consistent spatial morphology

3\. Temporal persistence across passes

4\. Environmental consistency (wind, waves)

5\. No matching natural phenomenon in the AOI



\---



\## Vessel attribution methodology



Never "guilty vessel". Only candidate vessel with attribution score:



Spill centroid -> probable origin -> release time

&#x20; -> AIS tracks in radius + time window

&#x20; -> heading / speed / route comparison

&#x20; -> AIS gaps + loitering + ship-to-ship proximity

&#x20; -> attribution score -> ranked candidates



Output: MT SAGAR - 87% (probable source), MV BAY STAR - 61%, FV MEENAKSHI - 22%.



\---



\## End-to-end demo script (10 steps)



1\. Open dashboard -> click Satellite -> Start Scan

2\. Incident ID created (OCEAN-2026-XXX), badge turns orange

3\. Detection completes -> badge turns red with confidence %

4\. Map section -> real OpenStreetMap shows spill + 3 candidate ships + drift trajectory

5\. Vessel attribution panel ranks candidates

6\. Drift timeline shows NOW, +6h, +12h, +24h

7\. Auto-generated Alert appears (toast top-right)

8\. Alert section -> AI-selected scenario card glows + voice announces scenario + recommended action

9\. Review section -> evidence-based case: satellite, AI, AIS, drift, environment scores + Approve / Reject / Escalate

10\. Response -> containment workflow (prototype)



\---



\## Judge attack list — safe answers



| Question | Answer |

|---|---|

| Is this live satellite data? | No - demo uses simulated / live-ready interfaces. Production connects to Copernicus / ASF. |

| Is the AI actually trained? | Not yet. Current detector is rule-based. Planned model: U-Net on Sentinel-1 SAR. |

| How do you know it is oil? | 5-factor check: backscatter + morphology + persistence + environment + no natural match. |

| How do you prove the vessel? | We don't. We rank candidates by attribution score using spatial, temporal, and kinematic evidence. |

| Where does ug/L come from? | It is an estimated proxy index, not a lab measurement. |

| Is 99.8% success real? | That should be labelled System Uptime, not accuracy. Detection F1 is not yet measured. |

| What is 100% coverage? | AOI coverage, not ocean coverage. Currently 250 km2 - Bay of Bengal AOI-1. |

| Why should I approve case #001? | Overall evidence score combines 5 sub-scores. Full breakdown visible in Review section. |



\---



\## What works vs what is planned



Works (demo):

\- Incident workflow (scan, detect, map, attribution, alert, review)

\- Real map with real tiles (OpenStreetMap)

\- Real weather / marine data (Open-Meteo)

\- Rule-based scenario inference (6 causes)

\- Voice announcement on Alert page

\- Review queue with evidence scoring



Planned (production):

\- Live Sentinel-1 / RISAT ingestion

\- Live AIS stream filtering

\- Trained SAR segmentation model

\- Physically-modelled drift (OpenDrift / GNOME)

\- Coast Guard / Maritime Authority integration

\- Model retraining loop from human-labelled cases



\---



\## Roadmap



1\. Connect Sentinel-1 GRD via Copernicus Data Space

2\. Train U-Net on labelled SAR oil spills, publish F1 / ROC-AUC

3\. Replace rule-based drift with OpenDrift

4\. Live AIS via AISStream

5\. Coast Guard response integration

6\. Continual learning from reviewer decisions



\---



OCEAN EYE - Oil Spill Intelligence Platform - Prototype for SIH 2026

