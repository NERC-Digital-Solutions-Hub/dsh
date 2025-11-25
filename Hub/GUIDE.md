# Guide

## How to update the GitHub Webpage

Simply pushing commits is not enough for changes to update the GitHub Webpage. You MUST call `npm run build` then commit the built files and push. Build compiles the webpage to the 'docs' directory where GitHub Webpages reads from.

## How to add UPRN UK Web Map to the UPRN app

Here is a step-by-step guide on how to add the UPRN UK web map to the UPRN app. Its relatively simple but requires mapping layer IDs from the web map to table names in the postgres database. This guide will be split into two parts: front-end and back-end configuration.

### Front-End

- In the front-end, navigate to `static/config/apps/uprn`. Here you will find a `config.json` file and a `maps` directory.
- In the maps directory, find the `uprn-uk.json` which is a placeholder. This is a copy of the `uprn-manchester.json` with all the IDs removed. The ONLY thing you need to modify here is the ID properties.
- In the case you must modify something else other than the ID property, then please find the `app-config-guide.md`, which describes how to configure each property.
- Once IDs are correctly added, the front-end configuration is complete.

### Back-End

- For the back-end, you only need to add entries to the postgres database. The tables need to update are the `uprn_srv2.area_layers` and `uprn_srv2.data_layers`, as these contain the mapping information from the web map layer IDs to the postgres tables.
- You should mirror the current entries in these tables, as these entries are for the UPRN Manchester Web Map and should reflect the UPRN UK Web Map.
- Therefore, you should copy the existing rows, and create new rows, with only the `remote_layer_id` field changing to the reflect the in the UPRN UK web map.
- DO NOT replace or overwrite the entries related to the UPRN Manchester web map. Both the UPRN Manchester and UPRN UK layers should be able to co-exist.
- Once entries are correctly added, the front-end configuration is complete.

### Tips

- Use an LLM to map the layer IDs from the UPRN Manchester to the layer IDs from the UPRN UK web map using their titles. Once this is achieved, the mapping can be achieved relatively easily via scripts.
